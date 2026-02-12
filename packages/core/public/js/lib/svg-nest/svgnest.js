/*!
 * SvgNest
 * Licensed under the MIT license
 */

(function(root){
	'use strict';

	root.SvgNest = new SvgNest();

	function SvgNest(){
		var self = this;

		var svg = null;

		// keep a reference to any style nodes, to maintain color/fill info
		this.style = null;

		var parts = null;

		var tree = null;


		var bin = null;
		var binPolygon = null;
		var binBounds = null;
		var nfpCache = {};
		var config = {
			clipperScale: 10000000,
			curveTolerance: 0.3,
			spacing: 0,
			rotations: 4,
            populationSize: 10,
            generations: 1,
			mutationRate: 10,
			useHoles: true,
            exploreConcave: false,
		};

		this.working = false;

		var GA = null;
		var best = null;
		var workerTimer = null;
		var progress = 0;

		this.parsesvg = function(svgstring){
			// reset if in progress
			this.stop();

			bin = null;
			binPolygon = null;
			tree = null;

			// parse svg
			svg = SvgParser.load(svgstring);

			this.style = SvgParser.getStyle();

			svg = SvgParser.clean();

			tree = this.getParts(svg.childNodes);

			//re-order elements such that deeper elements are on top, so they can be moused over
			function zorder(paths){
				// depth-first
				var length = paths.length;
				for(var i=0; i<length; i++){
					if(paths[i].children && paths[i].children.length > 0){
						zorder(paths[i].children);
					}
				}
			}

			return svg;
		}

		this.setbin = function(element){
			if(!svg){
				return;
			}
			bin = element;
		}

		this.config = function(c){
			// clean up inputs

			if(!c){
				return config;
			}

			if(c.curveTolerance && !this.GeometryUtil.almostEqual(parseFloat(c.curveTolerance), 0)){
				config.curveTolerance =  parseFloat(c.curveTolerance);
			}

			if('spacing' in c){
				config.spacing = parseFloat(c.spacing);
			}

			if(c.rotations && parseInt(c.rotations) > 0){
				config.rotations = parseInt(c.rotations);
			}
			if (c.generations && parseInt(c.generations) > 0) {
				config.generations = parseInt(c.generations)
			}

			if(c.populationSize && parseInt(c.populationSize) > 2){
				config.populationSize = parseInt(c.populationSize);
			}

			if(c.mutationRate && parseInt(c.mutationRate) > 0){
				config.mutationRate = parseInt(c.mutationRate);
			}

			if('useHoles' in c){
				config.useHoles = !!c.useHoles;
			}

			if('exploreConcave' in c){
				config.exploreConcave = !!c.exploreConcave;
			}

			best = null;
			nfpCache = {};
			binPolygon = null;
			GA = null;

			return config;
        }

		// progressCallback is called when progress is made
		// displayCallback is called when a new placement has been made
		this.start = function(progressCallback, displayCallback){
			if(!svg || !bin){
				return false;
			}

			parts = Array.prototype.slice.call(svg.childNodes);
			var binindex = parts.indexOf(bin);

			if(binindex >= 0){
				// don't process bin as a part of the tree
				parts.splice(binindex, 1);
			}

			// build tree without bin
            tree = this.getParts(parts.slice(0));

            offsetTree(tree, 0.5*config.spacing, this.polygonOffset.bind(this));

			// offset tree recursively
			function offsetTree(t, offset, offsetFunction){
				for(var i=0; i<t.length; i++){
					var offsetpaths = offsetFunction(t[i], offset);
					if(offsetpaths.length == 1){
						// replace array items in place
						Array.prototype.splice.apply(t[i], [0, t[i].length].concat(offsetpaths[0]));
					}

					if(t[i].childNodes && t[i].childNodes.length > 0){
						offsetTree(t[i].childNodes, -offset, offsetFunction);
					}
				}
            }

			binPolygon = SvgParser.polygonify(bin);
			binPolygon = this.cleanPolygon(binPolygon);

			if(!binPolygon || binPolygon.length < 3){
				return false;
            }

			binBounds = GeometryUtil.getPolygonBounds(binPolygon);

			if(config.spacing > 0){
				var offsetBin = this.polygonOffset(binPolygon, -0.5*config.spacing);
				if(offsetBin.length == 1){
					// if the offset contains 0 or more than 1 path, something went wrong.
					binPolygon = offsetBin.pop();
				}
			}

			binPolygon.id = -1;

			// put bin on origin
			var xbinmax = binPolygon[0].x;
			var xbinmin = binPolygon[0].x;
			var ybinmax = binPolygon[0].y;
			var ybinmin = binPolygon[0].y;

			for(var i=1; i<binPolygon.length; i++){
				if(binPolygon[i].x > xbinmax){
					xbinmax = binPolygon[i].x;
				}
				else if(binPolygon[i].x < xbinmin){
					xbinmin = binPolygon[i].x;
				}
				if(binPolygon[i].y > ybinmax){
					ybinmax = binPolygon[i].y;
				}
				else if(binPolygon[i].y < ybinmin){
					ybinmin = binPolygon[i].y;
				}
			}

			for(i=0; i<binPolygon.length; i++){
				binPolygon[i].x -= xbinmin;
				binPolygon[i].y -= ybinmin;
			}

			binPolygon.width = xbinmax-xbinmin;
			binPolygon.height = ybinmax-ybinmin;

			// all paths need to have the same winding direction
			if(GeometryUtil.polygonArea(binPolygon) > 0){
				binPolygon.reverse();
			}

			// remove duplicate endpoints, ensure counterclockwise winding direction
			for(i=0; i<tree.length; i++){
				var start = tree[i][0];
				var end = tree[i][tree[i].length-1];
				if(start == end || (GeometryUtil.almostEqual(start.x,end.x) && GeometryUtil.almostEqual(start.y,end.y))){
					tree[i].pop();
				}

				if(GeometryUtil.polygonArea(tree[i]) > 0){
					tree[i].reverse();
				}
			}

			var self = this;
			this.working = false;

			workerTimer = setInterval(function(){
				if(!self.working){
					self.launchWorkers.call(self, tree, binPolygon, config, progressCallback, displayCallback);
					self.working = true;
				}

				progressCallback(progress);
			}, 100);
        }

        // ====== Custom Functions for Beam Studio ======
        this.nestElements = (containerPolygon, elementsPolygons, progressCallback, displayCallback, completeCallback) => {
			this.onStop = completeCallback;
            // Offset children, using clipper
            offsetTree(elementsPolygons, 0.5*config.spacing, this.polygonOffset.bind(this));
            // offset tree recursively
            function offsetTree(t, offset, offsetFunction){
                for(var i=0; i<t.length; i++){
					var offsetpaths = offsetFunction(t[i], offset);
                    if(offsetpaths.length == 1){
						// replace array items in place
						offsetpaths.id = t[i].id;
						offsetpaths.source = t[i].source;
                        Array.prototype.splice.apply(t[i], [0, t[i].length].concat(offsetpaths[0]));
                    }
                    if(t[i].childNodes && t[i].childNodes.length > 0){
                        offsetTree(t[i].childNodes, -offset, offsetFunction);
                    }
				}
			}

            containerPolygon = this.cleanPolygon(containerPolygon);
            if(!containerPolygon || containerPolygon.length < 3){
                return false;
            }

            // binBounds = GeometryUtil.getPolygonBounds(containerPolygon);

            if(config.spacing > 0){
                var offsetBin = this.polygonOffset(containerPolygon, -0.5*config.spacing);
				console.log(offsetBin[0]);
                if(offsetBin.length == 1){
                    // if the offset contains 0 or more than 1 path, something went wrong.
                    containerPolygon = offsetBin.pop();
                }
			}
			console.log(containerPolygon);

            // put bin on origin
            let xbinmax = containerPolygon[0].x;
            let xbinmin = containerPolygon[0].x;
            let ybinmax = containerPolygon[0].y;
            let ybinmin = containerPolygon[0].y;

            for(let i=1; i<containerPolygon.length; i++){
            	if(containerPolygon[i].x > xbinmax){
            		xbinmax = containerPolygon[i].x;
            	}
            	else if(containerPolygon[i].x < xbinmin){
            		xbinmin = containerPolygon[i].x;
            	}
            	if(containerPolygon[i].y > ybinmax){
            		ybinmax = containerPolygon[i].y;
            	}
            	else if(containerPolygon[i].y < ybinmin){
            		ybinmin = containerPolygon[i].y;
            	}
            }

            containerPolygon.width = xbinmax-xbinmin;
            containerPolygon.height = ybinmax-ybinmin;

            // all paths need to have the same winding direction
            if(this.GeometryUtil.polygonArea(containerPolygon) > 0){
            	containerPolygon.reverse();
            }

            // remove duplicate endpoints, ensure counterclockwise winding direction
            for(let i=0; i<elementsPolygons.length; i++){
                const start = elementsPolygons[i][0];
                const end = elementsPolygons[i][elementsPolygons[i].length-1];
                if(start == end || (this.GeometryUtil.almostEqual(start.x,end.x) && this.GeometryUtil.almostEqual(start.y,end.y))){
                    elementsPolygons[i].pop();
                }

                if(this.GeometryUtil.polygonArea(elementsPolygons[i]) > 0){
                    elementsPolygons[i].reverse();
                }
			}

            elementsPolygons = elementsPolygons.map(p => {
                return toNestCoordinates(p, 1);
			});
			console.log(elementsPolygons);
            console.log(config);

            var self = this;
            this.working = false;
			this.currentGen = 0;
			this.finished = 0;
			this.elementsPolygons = elementsPolygons;
			GA = null;
			nfpCache = {};
			best = null;

            workerTimer = setInterval(function(){
                if(!self.working){
					self.launchNestWorkers.call(self, elementsPolygons, containerPolygon, config, progressCallback, displayCallback);
					self.working = true;
                }
            }, 100);
        }

        // ====== Custom function from launchWorkers
        this.launchNestWorkers = function(elementsPolygons, containerPolygon, config, progressCallback, displayCallback){
			var i,j;
			if(GA === null){
				// initiate new GA
				var adam = elementsPolygons.slice(0);

				// seed with decreasing area
				adam.sort(function(a, b){
					return Math.abs(window.SvgNest.GeometryUtil.polygonArea(b)) - Math.abs(window.SvgNest.GeometryUtil.polygonArea(a));
				});

				GA = new GeneticAlgorithm(adam, containerPolygon, config);
			}
			// Generate array of population w/ size = population, randomly rotated, mutate => excahnge

			var individual = null;

			// evaluate all members of the population
			for(i=0; i<GA.population.length; i++){
				if(!GA.population[i].fitness){
					individual = GA.population[i];
					break;
				}
			}
			if(individual === null){
				// all individuals have been evaluated, start next generation
				GA.generation();
                individual = GA.population[1];
				this.currentGen += 1;
				console.log('Gen', this.currentGen, 'End');
            }

			var placelist = individual.placement;
			var rotations = individual.rotation;

			var ids = [];
			for(i=0; i<placelist.length; i++){
				ids.push(placelist[i].id);
				placelist[i].rotation = rotations[i];
			}

			var nfpPairs = [];
			var key;
            var newCache = {};

			for(i=0; i<placelist.length; i++){
                var part = placelist[i];
				key = {A: containerPolygon.id || -1, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i]};
				if(!nfpCache[JSON.stringify(key)]){
					nfpPairs.push({A: containerPolygon, B: part, key: key});
				}
				else{
					newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
				}
				for(j=0; j<i; j++){
					var placed = placelist[j];
					key = {A: placed.id, B: part.id, inside: false, Arotation: rotations[j], Brotation: rotations[i]};
					if(!nfpCache[JSON.stringify(key)]){
						nfpPairs.push({A: placed, B: part, key: key});
					}
					else{
						newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
					}
				}
            }

			// only keep cache for one cycle
            nfpCache = newCache;

			var worker = new PlacementWorker(containerPolygon, placelist.slice(0), ids, rotations, config, nfpCache);

			var p = new SvgNestParallel(nfpPairs, {
				env: {
					containerPolygon: containerPolygon,
					searchEdges: config.exploreConcave,
					useHoles: config.useHoles
				},
				evalPath: 'js/lib/svg-nest/util/eval.js'
			});

			p.require('matrix.js');
			p.require('geometryutil.js');
			p.require('placementworker.js');
			p.require('clipper.js');

			var self = this;
			var spawncount = 0;
			p._spawnMapWorker = function (i, cb, done, env, wrk){
				// hijack the worker call to check progress
				progress = spawncount++/nfpPairs.length;
				return SvgNestParallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
			}
			p.map(function(pair){
				if(!pair || pair.length == 0){
					return null;
				};
        const rotatePolygon = (polygon, degrees) => {
          const rotated = [];
          const angle = degrees * Math.PI / 180;
          for (let i=0; i < polygon.length; i++){
            const x = polygon[i].x;
            const y = polygon[i].y;
            const x1 = x * Math.cos(angle) - y * Math.sin(angle);
            const y1 = x * Math.sin(angle) + y * Math.cos(angle);

            rotated.push({ x: x1, y: y1 });
          }

          if (polygon.children && polygon.children.length > 0){
            rotated.children = [];
            for(let j=0; j < polygon.children.length; j++){
              rotated.children.push(rotatePolygon(polygon.children[j], degrees));
            }
          }

          return rotated;
        };
				var searchEdges = global.env.searchEdges;
        var useHoles = global.env.useHoles;
		    var A = rotatePolygon(pair.A, pair.key.Arotation);
        var B = rotatePolygon(pair.B, pair.key.Brotation);
        var nfp;

				if (pair.key.inside) {
					if (GeometryUtil.isRectangle(A, 0.001)) {
            nfp = GeometryUtil.noFitPolygonRectangle(A,B);
					} else {
						nfp = GeometryUtil.noFitPolygon(A,B,true,searchEdges);
					}

					// ensure all interior NFPs have the same winding direction
					if (nfp && nfp.length > 0) {
						for (let i = 0; i < nfp.length; i++) {
							if (GeometryUtil.polygonArea(nfp[i]) > 0) {
								nfp[i].reverse();
							}
						}
					} else {
						// warning on null inner NFP
						// this is not an error, as the part may simply be larger than the bin or otherwise unplaceable due to geometry
						log('NFP Warning: ', pair.key);
					}
				} else {
					if(searchEdges) {
						nfp = GeometryUtil.noFitPolygon(A,B,false,searchEdges);
					}
					else{
						nfp = minkowskiDifference(A,B);
					}
					// sanity check
					if(!nfp || nfp.length == 0){
						log('NFP Error: ', pair.key);
						log('A: ',JSON.stringify(A));
						log('B: ',JSON.stringify(B));
						return null;
					}
					for(let i=0; i<nfp.length; i++){
						if(!searchEdges || i==0){ // if searchedges is active, only the first NFP is guaranteed to pass sanity check
							if(Math.abs(GeometryUtil.polygonArea(nfp[i])) < Math.abs(GeometryUtil.polygonArea(A))){
								log('NFP Area Error: ', Math.abs(GeometryUtil.polygonArea(nfp[i])), pair.key);
								log('NFP:', JSON.stringify(nfp[i]));
								log('A: ',JSON.stringify(A));
								log('B: ',JSON.stringify(B));
								nfp.splice(i,1);
								return null;
							}
						}
					}

					if(nfp.length == 0){
						return null;
					}

					// for outer NFPs, the first is guaranteed to be the largest. Any subsequent NFPs that lie inside the first are holes
					for(let i=0; i<nfp.length; i++){
						if(GeometryUtil.polygonArea(nfp[i]) > 0){
							nfp[i].reverse();
						}

						if(i > 0){
							if(GeometryUtil.pointInPolygon(nfp[i][0], nfp[0])){
								if(GeometryUtil.polygonArea(nfp[i]) < 0){
									nfp[i].reverse();
								}
							}
						}
					}

					// generate nfps for children (holes of parts) if any exist
					if(useHoles && A.childNodes && A.childNodes.length > 0){
						var Bbounds = GeometryUtil.getPolygonBounds(B);

						for(let i=0; i<A.childNodes.length; i++){
							var Abounds = GeometryUtil.getPolygonBounds(A.childNodes[i]);

							// no need to find nfp if B's bounding box is too big
							if(Abounds.width > Bbounds.width && Abounds.height > Bbounds.height){

								var cnfp = GeometryUtil.noFitPolygon(A.childNodes[i],B,true,searchEdges);
								// ensure all interior NFPs have the same winding direction
								if(cnfp && cnfp.length > 0){
									for(var j=0; j<cnfp.length; j++){
										if(GeometryUtil.polygonArea(cnfp[j]) < 0){
											cnfp[j].reverse();
										}
										nfp.push(cnfp[j]);
									}
								}

							}
						}
					}
				}

				function log(){
					if(typeof console !== "undefined") {
						console.log.apply(console,arguments);
					}
				}

				function toClipperCoordinates(polygon){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							X: polygon[i].x,
							Y: polygon[i].y
						});
					}

					return clone;
				};

				function toNestCoordinates(polygon, scale){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							x: polygon[i].X !== undefined ? polygon[i].X/scale : polygon[i].x/scale,
							y: polygon[i].Y !== undefined ? polygon[i].Y/scale : polygon[i].y/scale
                        });
					}

					return clone;
				};

				function minkowskiDifference(A, B){
					var Ac = toClipperCoordinates(A);
					ClipperLib.JS.ScaleUpPath(Ac, 10000000);
					var Bc = toClipperCoordinates(B);
					ClipperLib.JS.ScaleUpPath(Bc, 10000000);
					for(var i=0; i<Bc.length; i++){
						Bc[i].X *= -1;
						Bc[i].Y *= -1;
					}
					var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
					var clipperNfp = [];

					var largestArea = null;
					for(i=0; i<solution.length; i++){
						var n = toNestCoordinates(solution[i], 10000000);
						var sarea = GeometryUtil.polygonArea(n);
						if(largestArea === null || largestArea > sarea){
							clipperNfp = n;
							largestArea = sarea;
						}
					}

					for(var i=0; i<clipperNfp.length; i++){
						clipperNfp[i].x += B[0].x;
						clipperNfp[i].y += B[0].y;
					}

					return [clipperNfp];
				}
                // Gererate NFP
				return {key: pair.key, value: nfp};
			}).then(function(generatedNfp){
				if(generatedNfp){
					for(var i=0; i<generatedNfp.length; i++){
						var Nfp = generatedNfp[i];

						if(Nfp){
							// a null nfp means the nfp could not be generated, either because the parts simply don't fit or an error in the nfp algo
							var key = JSON.stringify(Nfp.key);
							nfpCache[key] = Nfp.value;
						}
					}
				}
				worker.nfpCache = nfpCache;

				// can't use .spawn because our data is an array
				var p2 = new SvgNestParallel([placelist.slice(0)], {
					env: {
						self: worker
					},
					evalPath: 'js/lib/svg-nest/util/eval.js'
				});

				p2.require('json.js');
				p2.require('clipper.js');
				p2.require('matrix.js');
				p2.require('geometryutil.js');
				p2.require('placementworker.js');
				p2.map(worker.placePaths).then(function(placements) {
					self.finished += 1;
					if (!placements || placements.length == 0) {
						return;
          }

					individual.fitness = placements[0].fitness;
					var bestresult = placements[0];
					for(var i=1; i<placements.length; i++){
						if(placements[i].fitness < bestresult.fitness){
							bestresult = placements[i];
						}
          }

					if(!best || bestresult.fitness < best.fitness){
						best = bestresult;
						console.log('fitness', best.fitness);

						var placedArea = 0;
						var totalArea = 0;
						var numParts = placelist.length;
            var numPlacedParts = 0;
						for(i=0; i<best.placements.length; i++){
							totalArea += Math.abs(window.SvgNest.GeometryUtil.polygonArea(containerPolygon));
							for(var j=0; j<best.placements[i].length; j++){
								placedArea += Math.abs(window.SvgNest.GeometryUtil.polygonArea(elementsPolygons[best.placements[i][j].id]));
								numPlacedParts++;
							}
						}
						self.bestResult = bestresult;
                        self.applyPlacement(best.placements, elementsPolygons)
						// displayCallback(self.applyPlacement(best.placements, elementsPolygons), placedArea/totalArea, numPlacedParts, numParts);
					} else {
						// displayCallback();
					}
					self.working = false;
				}, function (err) {
					console.log(err);
				});
			}, function (err) {
				console.log(err);
			});
		}

		this.launchWorkers = function(tree, binPolygon, config, progressCallback, displayCallback){
			function shuffle(array) {
			  var currentIndex = array.length, temporaryValue, randomIndex ;

			  // While there remain elements to shuffle...
			  while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			  }

			  return array;
			}

			var i,j;

			if(GA === null){
				// initiate new GA
				var adam = tree.slice(0);
				console.log(adam)

				// seed with decreasing area
				adam.sort(function(a, b){
					return Math.abs(GeometryUtil.polygonArea(b)) - Math.abs(GeometryUtil.polygonArea(a));
				});

				GA = new GeneticAlgorithm(adam, binPolygon, config);
			}
			// Generate array of population w/ size = population, randomly rotated, mutate => excahnge

			var individual = null;
			console.log(GA);

			// evaluate all members of the population
			for(i=0; i<GA.population.length; i++){
				if(!GA.population[i].fitness){
					individual = GA.population[i];
					break;
				}
			}
			if(individual === null){
				// all individuals have been evaluated, start next generation
				GA.generation();
				individual = GA.population[1];
			}

			var placelist = individual.placement;
			var rotations = individual.rotation;

			var ids = [];
			for(i=0; i<placelist.length; i++){
				ids.push(placelist[i].id);
				placelist[i].rotation = rotations[i];
			}

			var nfpPairs = [];
			var key;
			var newCache = {};

			for(i=0; i<placelist.length; i++){
				var part = placelist[i];
				key = {A: binPolygon.id, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i]};
				if(!nfpCache[JSON.stringify(key)]){
					nfpPairs.push({A: binPolygon, B: part, key: key});
				}
				else{
					newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
				}
				for(j=0; j<i; j++){
					var placed = placelist[j];
					key = {A: placed.id, B: part.id, inside: false, Arotation: rotations[j], Brotation: rotations[i]};
					if(!nfpCache[JSON.stringify(key)]){
						nfpPairs.push({A: placed, B: part, key: key});
					}
					else{
						newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)]
					}
				}
			}

			// only keep cache for one cycle
			nfpCache = newCache;

			var worker = new PlacementWorker(binPolygon, placelist.slice(0), ids, rotations, config, nfpCache);

			var p = new Parallel(nfpPairs, {
				env: {
					binPolygon: binPolygon,
					searchEdges: config.exploreConcave,
					useHoles: config.useHoles
				},
				evalPath: 'util/eval.js'
			});

			p.require('matrix.js');
			p.require('geometryutil.js');
			p.require('placementworker.js');
			p.require('clipper.js');

			var self = this;
			var spawncount = 0;
			p._spawnMapWorker = function (i, cb, done, env, wrk){
				// hijack the worker call to check progress
				progress = spawncount++/nfpPairs.length;
				return Parallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
			}

			p.map(function(pair){
				if(!pair || pair.length == 0){
					return null;
				}
				var searchEdges = global.env.searchEdges;
				var useHoles = global.env.useHoles;

				var A = rotatePolygon(pair.A, pair.key.Arotation);
				var B = rotatePolygon(pair.B, pair.key.Brotation);

				var nfp;

				if(pair.key.inside){
					if(GeometryUtil.isRectangle(A, 0.001)){
						nfp = GeometryUtil.noFitPolygonRectangle(A,B);
					}
					else{
						nfp = GeometryUtil.noFitPolygon(A,B,true,searchEdges);
					}

					// ensure all interior NFPs have the same winding direction
					if(nfp && nfp.length > 0){
						for(var i=0; i<nfp.length; i++){
							if(GeometryUtil.polygonArea(nfp[i]) > 0){
								nfp[i].reverse();
							}
						}
					}
					else{
						// warning on null inner NFP
						// this is not an error, as the part may simply be larger than the bin or otherwise unplaceable due to geometry
						log('NFP Warning: ', pair.key);
					}
				}
				else{
					if(searchEdges){
						nfp = GeometryUtil.noFitPolygon(A,B,false,searchEdges);
					}
					else{
						nfp = minkowskiDifference(A,B);
					}
					// sanity check
					if(!nfp || nfp.length == 0){
						log('NFP Error: ', pair.key);
						log('A: ',JSON.stringify(A));
						log('B: ',JSON.stringify(B));
						return null;
					}

					for(var i=0; i<nfp.length; i++){
						if(!searchEdges || i==0){ // if searchedges is active, only the first NFP is guaranteed to pass sanity check
							if(Math.abs(GeometryUtil.polygonArea(nfp[i])) < Math.abs(GeometryUtil.polygonArea(A))){
								log('NFP Area Error: ', Math.abs(GeometryUtil.polygonArea(nfp[i])), pair.key);
								log('NFP:', JSON.stringify(nfp[i]));
								log('A: ',JSON.stringify(A));
								log('B: ',JSON.stringify(B));
								nfp.splice(i,1);
								return null;
							}
						}
					}

					if(nfp.length == 0){
						return null;
					}

					// for outer NFPs, the first is guaranteed to be the largest. Any subsequent NFPs that lie inside the first are holes
					for(var i=0; i<nfp.length; i++){
						if(GeometryUtil.polygonArea(nfp[i]) > 0){
							nfp[i].reverse();
						}

						if(i > 0){
							if(GeometryUtil.pointInPolygon(nfp[i][0], nfp[0])){
								if(GeometryUtil.polygonArea(nfp[i]) < 0){
									nfp[i].reverse();
								}
							}
						}
					}

					// generate nfps for children (holes of parts) if any exist
					if(useHoles && A.childNodes && A.childNodes.length > 0){
						var Bbounds = GeometryUtil.getPolygonBounds(B);

						for(var i=0; i<A.childNodes.length; i++){
							var Abounds = GeometryUtil.getPolygonBounds(A.childNodes[i]);

							// no need to find nfp if B's bounding box is too big
							if(Abounds.width > Bbounds.width && Abounds.height > Bbounds.height){

								var cnfp = GeometryUtil.noFitPolygon(A.childNodes[i],B,true,searchEdges);
								// ensure all interior NFPs have the same winding direction
								if(cnfp && cnfp.length > 0){
									for(var j=0; j<cnfp.length; j++){
										if(GeometryUtil.polygonArea(cnfp[j]) < 0){
											cnfp[j].reverse();
										}
										nfp.push(cnfp[j]);
									}
								}

							}
						}
					}
				}

				function log(){
					if(typeof console !== "undefined") {
						console.log.apply(console,arguments);
					}
				}

				function toClipperCoordinates(polygon){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							X: polygon[i].x,
							Y: polygon[i].y
						});
					}

					return clone;
				};

				function toNestCoordinates(polygon, scale){
					var clone = [];
					for(var i=0; i<polygon.length; i++){
						clone.push({
							x: polygon[i].X/scale,
							y: polygon[i].Y/scale
						});
					}

					return clone;
				};

				function minkowskiDifference(A, B){
					var Ac = toClipperCoordinates(A);
					ClipperLib.JS.ScaleUpPath(Ac, 10000000);
					var Bc = toClipperCoordinates(B);
					ClipperLib.JS.ScaleUpPath(Bc, 10000000);
					for(var i=0; i<Bc.length; i++){
						Bc[i].X *= -1;
						Bc[i].Y *= -1;
					}
					var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
					var clipperNfp = [];

					var largestArea = null;
					for(i=0; i<solution.length; i++){
						var n = toNestCoordinates(solution[i], 10000000);
						var sarea = GeometryUtil.polygonArea(n);
						if(largestArea === null || largestArea > sarea){
							clipperNfp = n;
							largestArea = sarea;
						}
					}

					for(var i=0; i<clipperNfp.length; i++){
						clipperNfp[i].x += B[0].x;
						clipperNfp[i].y += B[0].y;
					}

					return [clipperNfp];
				}
				// Gererate NFP
				return {key: pair.key, value: nfp};
			}).then(function(generatedNfp){
				if(generatedNfp){
					for(var i=0; i<generatedNfp.length; i++){
						var Nfp = generatedNfp[i];

						if(Nfp){
							// a null nfp means the nfp could not be generated, either because the parts simply don't fit or an error in the nfp algo
							var key = JSON.stringify(Nfp.key);
							nfpCache[key] = Nfp.value;
						}
					}
				}
				worker.nfpCache = nfpCache;

				// can't use .spawn because our data is an array
				var p2 = new Parallel([placelist.slice(0)], {
					env: {
						self: worker
					},
					evalPath: 'util/eval.js'
				});

				p2.require('json.js');
				p2.require('clipper.js');
				p2.require('matrix.js');
				p2.require('geometryutil.js');
				p2.require('placementworker.js');

				p2.map(worker.placePaths).then(function(placements){
					if(!placements || placements.length == 0){
						return;
					}

					individual.fitness = placements[0].fitness;
					var bestresult = placements[0];

					for(var i=1; i<placements.length; i++){
						if(placements[i].fitness < bestresult.fitness){
							bestresult = placements[i];
						}
					}

					if(!best || bestresult.fitness < best.fitness){
						best = bestresult;

						var placedArea = 0;
						var totalArea = 0;
						var numParts = placelist.length;
						var numPlacedParts = 0;

						for(i=0; i<best.placements.length; i++){
							totalArea += Math.abs(GeometryUtil.polygonArea(binPolygon));
							for(var j=0; j<best.placements[i].length; j++){
								placedArea += Math.abs(GeometryUtil.polygonArea(tree[best.placements[i][j].id]));
								numPlacedParts++;
							}
						}
						displayCallback(self.applyPlacement(best.placements), placedArea/totalArea, numPlacedParts, numParts);
					}
					else{
						displayCallback();
					}
					self.working = false;
				}, function (err) {
					console.log(err);
				});
			}, function (err) {
				console.log(err);
			});
		}

		// assuming no intersections, return a tree where odd leaves are parts and even ones are holes
		// might be easier to use the DOM, but paths can't have paths as children. So we'll just make our own tree.
		this.getParts = function(paths){

			var i, j;
			var polygons = [];

			var numChildren = paths.length;
			for(i=0; i<numChildren; i++){
				var poly = SvgParser.polygonify(paths[i]);
				poly = this.cleanPolygon(poly);

				// todo: warn user if poly could not be processed and is excluded from the nest
				if(poly && poly.length > 2 && Math.abs(GeometryUtil.polygonArea(poly)) > config.curveTolerance*config.curveTolerance){
					poly.source = i;
					polygons.push(poly);
				}
			}

			// turn the list into a tree
			toTree(polygons);

			function toTree(list, idstart){
				var parents = [];
				var i,j;

				// assign a unique id to each leaf
				var id = idstart || 0;

				for(i=0; i<list.length; i++){
					var p = list[i];

					var ischild = false;
					for(j=0; j<list.length; j++){
						if(j==i){
							continue;
						}
						if(GeometryUtil.pointInPolygon(p[0], list[j]) === true){
							if(!list[j].children){
								list[j].children = [];
							}
							list[j].children.push(p);
							p.parent = list[j];
							ischild = true;
							break;
						}
					}

					if(!ischild){
						parents.push(p);
					}
				}

				for(i=0; i<list.length; i++){
					if(parents.indexOf(list[i]) < 0){
						list.splice(i, 1);
						i--;
					}
				}

				for(i=0; i<parents.length; i++){
					parents[i].id = id;
					id++;
				}

				for(i=0; i<parents.length; i++){
					if(parents[i].children){
						id = toTree(parents[i].children, id);
					}
				}

				return id;
			};

			return polygons;
		};

		// use the clipper library to return an offset to the given polygon. Positive offset expands the polygon, negative contracts
		// note that this returns an array of polygons
		this.polygonOffset = function(polygon, offset){
			if(!offset || offset == 0 || this.GeometryUtil.almostEqual(offset, 0)){
				return polygon;
			}

			var p = this.svgToClipper(polygon);
			var miterLimit = 2;
			var co = new ClipperLib.ClipperOffset(miterLimit, config.curveTolerance*config.clipperScale);
			co.AddPath(p, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

			var newpaths = new ClipperLib.Paths();
			co.Execute(newpaths, offset*config.clipperScale);

			var result = [];
			for(var i=0; i<newpaths.length; i++){
				result.push(this.clipperToSvg(newpaths[i]));
			}
			return result;
		};

		// returns a less complex polygon that satisfies the curve tolerance
		this.cleanPolygon = function(polygon){
			var p = this.svgToClipper(polygon);
			// remove self-intersections and find the biggest polygon that's left
			var simple = ClipperLib.Clipper.SimplifyPolygon(p, ClipperLib.PolyFillType.pftNonZero);

			if(!simple || simple.length == 0){
				return null;
			}

			var biggest = simple[0];
			var biggestarea = Math.abs(ClipperLib.Clipper.Area(biggest));
			for(var i=1; i<simple.length; i++){
				var area = Math.abs(ClipperLib.Clipper.Area(simple[i]));
				if(area > biggestarea){
					biggest = simple[i];
					biggestarea = area;
				}
			}

			// clean up singularities, coincident points and edges
			var clean = ClipperLib.Clipper.CleanPolygon(biggest, config.curveTolerance*config.clipperScale);

			if(!clean || clean.length == 0){
				return null;
			}

			return this.clipperToSvg(clean);
		}

		// converts a polygon from normal float coordinates to integer coordinates used by clipper, as well as x/y -> X/Y
		this.svgToClipper = function(polygon){
			var clip = [];
			for(var i=0; i<polygon.length; i++){
				clip.push({X: polygon[i].x !== undefined ? polygon[i].x : polygon[i].X, Y: polygon[i].y !== undefined ? polygon[i].y : polygon[i].Y});
			}
			ClipperLib.JS.ScaleUpPath(clip, config.clipperScale);

			return clip;
		}

		this.clipperToSvg = function(polygon){
			var normal = [];

			for(var i=0; i<polygon.length; i++){
				normal.push({x: polygon[i].X/config.clipperScale, y: polygon[i].Y/config.clipperScale});
			}

			return normal;
		}

		// returns an array of SVG elements that represent the placement, for export or rendering
		this.applyPlacement = function(placement, elementsPolygons){
            console.log(placement, elementsPolygons);
            for (let i = 0; i < placement.length; i++) {
                for (let j = 0; j < placement[i].length; j++) {
                    let p = placement[i][j]
                    const elementData = elementsPolygons[p.id];
                    //console.log(elementData);
                    const elemId = elementData.source;
                    const elem = $(`#${elemId}`)[0];
                    let bbox = svgCanvas.getBBox(elem);
                    let [dx, dy] = [0, 0];
					let tempMove = elementData.tempMove || {x: 0, y: 0, angle: 0};
					//console.log(tempMove);
                    let center = tempMove.origCenter || {x: bbox.x + bbox.width /2, y: bbox.y + bbox.height/2};
					//console.log(center);
                    if (p.rotation !== 0 || (tempMove && tempMove.angle !== 0)) {
                        const angle = svgedit.utilities.getRotationAngle(elem) - tempMove.angle;
                        const new_angle = (angle + p.rotation) % 360 ;
                        svgCanvas.setRotationAngle(new_angle, true, elem);
                        const rad = p.rotation / 180 * Math.PI;
                        dx = center.x * Math.cos(rad) - center.y * Math.sin(rad) - center.x;
                        dy = center.x * Math.sin(rad) + center.y * Math.cos(rad) - center.y;
					}
					//console.log('x', p.x, dx, tempMove.x)
					//console.log('y', p.y, dy, tempMove.y)
                    svgCanvas.moveElements([p.x + dx - tempMove.x], [p.y + dy - tempMove.y], [elem], false);
                    tempMove = {
                        x: p.x + dx,//relevant to original center
                        y: p.y + dy,
                        angle: p.rotation,
                        origCenter: center
                    };
                    elementData.tempMove = tempMove;
                }
            }
		}

		this.stop = () => {
			console.log('Stop');
			this.working = false;
			if(workerTimer){
				clearInterval(workerTimer);
			}
        };
	}

	function GeneticAlgorithm(adam, bin, config){

        this.config = config || { populationSize: 10, mutationRate: 10, rotations: 4 };
		this.binBounds = window.SvgNest.GeometryUtil.getPolygonBounds(bin);

		// population is an array of individuals. Each individual is a object representing the order of insertion and the angle each part is rotated
		var angles = [];
		for(var i=0; i<adam.length; i++){
			angles.push(this.randomAngle(adam[i]));
		}

        this.population = [{placement: adam, rotation: angles}];

		while(this.population.length < config.populationSize){
			var mutant = this.mutate(this.population[0]);
			this.population.push(mutant);
		}
	}

	// returns a random angle of insertion
	GeneticAlgorithm.prototype.randomAngle = function(part){

		var angleList = [];
		for(var i=0; i<Math.max(this.config.rotations,1); i++){
			angleList.push(i*(360/this.config.rotations));
		}

		function shuffleArray(array) {
			for (var i = array.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var temp = array[i];
				array[i] = array[j];
				array[j] = temp;
			}
			return array;
		}

		angleList = shuffleArray(angleList);

		for(i=0; i<angleList.length; i++){
			var rotatedPart = window.SvgNest.GeometryUtil.rotatePolygon(part, angleList[i]);

			// don't use obviously bad angles where the part doesn't fit in the bin
			if(rotatedPart.width < this.binBounds.width && rotatedPart.height < this.binBounds.height){
				return angleList[i];
			}
		}

		return 0;
	}

	// returns a mutated individual with the given mutation rate
	GeneticAlgorithm.prototype.mutate = function(individual){
		//Shallow Copy
		var clone = {placement: individual.placement.slice(0), rotation: individual.rotation.slice(0)};
		for(var i=0; i<clone.placement.length; i++){
			var rand = Math.random();
			if(rand < 0.01*this.config.mutationRate){
				// swap current part with next part
				var j = i+1;

				if(j < clone.placement.length){
					var temp = clone.placement[i];
					clone.placement[i] = clone.placement[j];
					clone.placement[j] = temp;
				}
			}

			rand = Math.random();
			if(rand < 0.01*this.config.mutationRate){
				clone.rotation[i] = this.randomAngle(clone.placement[i]);
			}
		}

		return clone;
	}

	// single point crossover
	GeneticAlgorithm.prototype.mate = function(male, female){
		var cutpoint = Math.round(Math.min(Math.max(Math.random(), 0.1), 0.9)*(male.placement.length-1));

		var gene1 = male.placement.slice(0,cutpoint);
		var rot1 = male.rotation.slice(0,cutpoint);

		var gene2 = female.placement.slice(0,cutpoint);
		var rot2 = female.rotation.slice(0,cutpoint);

		var i;

		for(i=0; i<female.placement.length; i++){
			if(!contains(gene1, female.placement[i].id)){
				gene1.push(female.placement[i]);
				rot1.push(female.rotation[i]);
			}
		}

		for(i=0; i<male.placement.length; i++){
			if(!contains(gene2, male.placement[i].id)){
				gene2.push(male.placement[i]);
				rot2.push(male.rotation[i]);
			}
		}

		function contains(gene, id){
			for(var i=0; i<gene.length; i++){
				if(gene[i].id == id){
					return true;
				}
			}
			return false;
		}

		return [{placement: gene1, rotation: rot1},{placement: gene2, rotation: rot2}];
	}

	GeneticAlgorithm.prototype.generation = function(){

		// Individuals with higher fitness are more likely to be selected for mating
		this.population.sort(function(a, b){
			return a.fitness - b.fitness;
		});

		// fittest individual is preserved in the new generation (elitism)
		var newpopulation = [this.population[0]];

		while(newpopulation.length < this.population.length){
			var male = this.randomWeightedIndividual();
			var female = this.randomWeightedIndividual(male);

			// each mating produces two children
			var children = this.mate(male, female);

			// slightly mutate children
			newpopulation.push(this.mutate(children[0]));

			if(newpopulation.length < this.population.length){
				newpopulation.push(this.mutate(children[1]));
			}
		}

		this.population = newpopulation;
	}

	// returns a random individual from the population, weighted to the front of the list (lower fitness value is more likely to be selected)
	GeneticAlgorithm.prototype.randomWeightedIndividual = function(exclude){
		var pop = this.population.slice(0);

		if(exclude && pop.indexOf(exclude) >= 0){
			pop.splice(pop.indexOf(exclude),1);
		}

		var rand = Math.random();

		var lower = 0;
		var weight = 1/pop.length;
		var upper = weight;

		for(var i=0; i<pop.length; i++){
			// if the random number falls between lower and upper bounds, select this individual
			if(rand > lower && rand < upper){
				return pop[i];
			}
			lower = upper;
			upper += 2*weight * ((pop.length-i)/pop.length);
		}

		return pop[0];
    }
    // ====== From util/placementworker.js ======
    // jsClipper uses X/Y instead of x/y...
    function toNestCoordinates(polygon, scale){
        var clone = [];
        for(var i=0; i<polygon.length; i++){
            clone.push({
                x: polygon[i].X !== undefined ? polygon[i].X/scale : polygon[i].x/scale,
				y: polygon[i].Y !== undefined ? polygon[i].Y/scale : polygon[i].y/scale
            });
        }
        clone.source = polygon.source;
        clone.id = polygon.id;

        return clone;
    };

    function rotatePolygon(polygon, degrees){
      const rotated = [];
      const angle = degrees * Math.PI / 180;
      for (let i=0; i < polygon.length; i++){
        const x = polygon[i].x;
        const y = polygon[i].y;
        const x1 = x * Math.cos(angle) - y * Math.sin(angle);
        const y1 = x * Math.sin(angle) + y * Math.cos(angle);

        rotated.push({ x: x1, y: y1 });
      }

      if (polygon.children && polygon.children.length > 0){
        rotated.children = [];
        for(let j=0; j < polygon.children.length; j++){
          rotated.children.push(rotatePolygon(polygon.children[j], degrees));
        }
      }

      return rotated;
    };

    function PlacementWorker(binPolygon, paths, ids, rotations, config, nfpCache){
        this.binPolygon = binPolygon;
        this.paths = paths;
        this.ids = ids;
        this.rotations = rotations;
        this.config = config;
        this.nfpCache = nfpCache || {};

        this.rotatePolygon = (polygon, degrees) => {
          const rotated = [];
          const angle = degrees * Math.PI / 180;
          for (let i=0; i < polygon.length; i++){
            const x = polygon[i].x;
            const y = polygon[i].y;
            const x1 = x * Math.cos(angle) - y * Math.sin(angle);
            const y1 = x * Math.sin(angle) + y * Math.cos(angle);

            rotated.push({ x: x1, y: y1 });
          }

          if (polygon.children && polygon.children.length > 0){
            rotated.children = [];
            for(let j=0; j < polygon.children.length; j++){
              rotated.children.push(this.rotatePolygon(polygon.children[j], degrees));
            }
          }

          return rotated;
        };

        this.toClipperCoordinates = (polygon) => {
          const clone = [];
          for (let i=0; i < polygon.length; i++) {
            clone.push({
              X: polygon[i].x,
              Y: polygon[i].y
            });
          }
          clone.source = polygon.source;
          clone.id = polygon.id;
          return clone;
        };

        this.toNestCoordinates = (polygon, scale) => {
          const clone = [];
          for (let i=0; i < polygon.length; i++) {
            clone.push({
              x: polygon[i].X !== undefined ? polygon[i].X/scale : polygon[i].x/scale,
              y: polygon[i].Y !== undefined ? polygon[i].Y/scale : polygon[i].y/scale,
            });
          }
          clone.source = polygon.source;
          clone.id = polygon.id;
          return clone;
        };

        // return a placement for the paths/rotations given
        // happens inside a webworker
        this.placePaths = function(paths){
          var self = global.env.self;

          if(!self.binPolygon) return null;

          let i, j, k, m, n, path;
          // rotate paths by given rotation
          let rotated = [];
          for(i=0; i<paths.length; i++){
            var r = this.rotatePolygon(paths[i], paths[i].rotation);
            r.rotation = paths[i].rotation;
            r.source = paths[i].source;
            r.id = paths[i].id;
            rotated.push(r);
          }

          paths = rotated;

          var allplacements = [];
          var fitness = 0;
          var binarea = Math.abs(GeometryUtil.polygonArea(self.binPolygon));
          var key, nfp;

          while(paths.length > 0){

            var placed = [];
            var placements = [];
            fitness += 1; // add 1 for each new bin opened (lower fitness is better)

            for(i=0; i<paths.length; i++){
              path = paths[i];

              // inner NFP
              key = JSON.stringify({A:-1,B:path.id,inside:true,Arotation:0,Brotation:path.rotation});
              var binNfp = self.nfpCache[key];

              // part unplaceable, skip
              if(!binNfp || binNfp.length == 0){
                continue;
              }

              // ensure all necessary NFPs exist
              var error = false;
              for(j=0; j<placed.length; j++){
                key = JSON.stringify({A:placed[j].id,B:path.id,inside:false,Arotation:placed[j].rotation,Brotation:path.rotation});
                nfp = self.nfpCache[key];

                if(!nfp){
                  error = true;
                  break;
                }
              }

              // part unplaceable, skip
              if(error){
                continue;
              }

              var position = null;
              if(placed.length == 0){
                // first placement, put it on the left
                for(j = 0; j < binNfp.length; j++){
                  for(k = 0; k < binNfp[j].length; k++){
                    if (position === null || binNfp[j][k].x-path[0].x < position.x ) {
                      position = {
                        x: binNfp[j][k].x-path[0].x,
                        y: binNfp[j][k].y-path[0].y,
                        id: path.id,
                        rotation: path.rotation,
                      }
                    }
                  }
                }

                placements.push(position);
                placed.push(path);

                continue;
              }

              var clipperBinNfp = [];
              for(j = 0; j < binNfp.length; j++){
                  clipperBinNfp.push(this.toClipperCoordinates(binNfp[j]));
              }

              ClipperLib.JS.ScaleUpPaths(clipperBinNfp, self.config.clipperScale);

              var clipper = new ClipperLib.Clipper();
              var combinedNfp = new ClipperLib.Paths();


              for(j = 0; j < placed.length; j++){
                key = JSON.stringify({A:placed[j].id,B:path.id,inside:false,Arotation:placed[j].rotation,Brotation:path.rotation});
                nfp = self.nfpCache[key];

                if(!nfp){
                    continue;
                }

                for (k = 0; k < nfp.length; k++) {
                  var clone = this.toClipperCoordinates(nfp[k]);
                  for(m=0; m<clone.length; m++){
                    clone[m].X += placements[j].x;
                    clone[m].Y += placements[j].y;
                  }

                  ClipperLib.JS.ScaleUpPath(clone, self.config.clipperScale);
                  clone = ClipperLib.Clipper.CleanPolygon(clone, 0.0001*self.config.clipperScale);
                  var area = Math.abs(ClipperLib.Clipper.Area(clone));
                  if(clone.length > 2 && area > 0.1*self.config.clipperScale*self.config.clipperScale){
                    clipper.AddPath(clone, ClipperLib.PolyType.ptSubject, true);
                  }
                }
              }

              if(!clipper.Execute(ClipperLib.ClipType.ctUnion, combinedNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)){
                  continue;
              }

              // difference with bin polygon
              var finalNfp = new ClipperLib.Paths();
              clipper = new ClipperLib.Clipper();

              clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
              clipper.AddPaths(clipperBinNfp, ClipperLib.PolyType.ptSubject, true);
              if(!clipper.Execute(ClipperLib.ClipType.ctDifference, finalNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)){
                  continue;
              }

              finalNfp = ClipperLib.Clipper.CleanPolygons(finalNfp, 0.0001*self.config.clipperScale);

              for(j=0; j<finalNfp.length; j++){
                  var area = Math.abs(ClipperLib.Clipper.Area(finalNfp[j]));
                  if(finalNfp[j].length < 3 || area < 0.1*self.config.clipperScale*self.config.clipperScale){
                      finalNfp.splice(j,1);
                      j--;
                  }
              }

              if(!finalNfp || finalNfp.length == 0){
                  continue;
              }

              var f = [];
              for(j = 0; j < finalNfp.length; j++){
                  // back to normal scale
                  f.push(this.toNestCoordinates(finalNfp[j], self.config.clipperScale));
              }
              finalNfp = f;

              // choose placement that results in the smallest bounding box
              // could use convex hull instead, but it can create oddly shaped nests (triangles or long slivers) which are not optimal for real-world use
              // todo: generalize gravity direction
              var minwidth = null;
              var minarea = null;
              var minx = null;
              var nf, area, shiftvector;

              for(j=0; j<finalNfp.length; j++){
                  nf = finalNfp[j];
                  if(Math.abs(GeometryUtil.polygonArea(nf)) < 2){
                      continue;
                  }

                  for(k=0; k<nf.length; k++){
                      var allpoints = [];
                      for(m=0; m<placed.length; m++){
                          for(n=0; n<placed[m].length; n++){
                              allpoints.push({x:placed[m][n].x+placements[m].x, y: placed[m][n].y+placements[m].y});
                          }
                      }

                      shiftvector = {
                          x: nf[k].x-path[0].x,
                          y: nf[k].y-path[0].y,
                          id: path.id,
                          rotation: path.rotation,
                          nfp: combinedNfp
                      };

                      for(m=0; m<path.length; m++){
                          allpoints.push({x: path[m].x+shiftvector.x, y:path[m].y+shiftvector.y});
                      }

                      var rectbounds = GeometryUtil.getPolygonBounds(allpoints);

                      // weigh width more, to help compress in direction of gravity
                      area = rectbounds.width*2 + rectbounds.height;

                      if(minarea === null || area < minarea || (GeometryUtil.almostEqual(minarea, area) && (minx === null || shiftvector.x < minx))){
                          minarea = area;
                          minwidth = rectbounds.width;
                          position = shiftvector;
                          minx = shiftvector.x;
                      }
                  }
              }
              if(position){
                  placed.push(path);
                  placements.push(position);
              }
            }

            if(minwidth){
              fitness += minwidth/binarea;
            }

            for (i=0; i<placed.length; i++) {
              var index = paths.indexOf(placed[i]);
              if(index >= 0){
                paths.splice(index,1);
              }
            }

            if (placements && placements.length > 0) {
              allplacements.push(placements);
            } else {
              break; // something went wrong
            }
          }

          // there were parts that couldn't be placed
          fitness += 2*paths.length;

          return {placements: allplacements, fitness: fitness, paths: paths, area: binarea };
        };
    }
    // clipperjs uses alerts for warnings
    function alert(message) {
        console.log('alert: ', message);
    }

})(window);
