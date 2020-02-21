define([
    'app/actions/beambox/svgeditor-function-wrapper',
    'helpers/api/svg-laser-parser',
    'app/actions/alert-actions',
    'app/actions/beambox/beambox-preference',
    'helpers/i18n',
], function(
    FnWrapper,
    SvgLaserParser,
    AlertActions,
    BeamboxPreference,
    i18n
) {
    const svgWebSocket = SvgLaserParser({ type: 'svgeditor' });
    if (!window.electron) {
        console.log('font is not supported in web browser');
        return {
            convertTextToPathAmoungSvgcontent: ()=>{}
        };
    }
    const ipc = electron.ipc;
    const events = electron.events;
    const activeLang = i18n.getActiveLang();
    const FontManager = require('font-manager');

    // a simple memoize function that takes in a function
    // and returns a memoized function
    const memoize = (fn) => {
        let cache = {};
        return (...args) => {
            let n = args[0];  // just taking one argument here
            if (n in cache) {
                // console.log('Fetching from cache');
                return cache[n];
            }
            else {
                // console.log('Calculating result');
                let result = fn(n);
                cache[n] = result;
                return result;
            }
        };
    };



    const hashCode = function(s) {
        var h = 0, l = s.length, i = 0;
        if ( l > 0 ){
            while (i < l) {
                h = (h << 5) - h + s.charCodeAt(i++) | 0;
            }
        }
        return Math.abs(h);
    };
    const availableFontFamilies = (function requestAvailableFontFamilies() {
        // get all available fonts in user PC
        const fonts = ipc.sendSync(events.GET_AVAILABLE_FONTS);

        // make it unique
        const fontFamilySet = new Set();
        fonts.map(font => fontFamilySet.add(font.family));

        // transfer to array and sort!
        return Array.from(fontFamilySet).sort((a, b) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
    })();
    const requestFontStylesOfTheFontFamily = memoize((family) => {
        const fonts = ipc.sendSync(events.FIND_FONTS, { family: family});
        const fontStyles = Array.from(fonts).map(font => font.style);

        return fontStyles;
    });
    const requestFontByFamilyAndStyle = ({family, style, weight, italic}) => {
        const font = ipc.sendSync(events.FIND_FONT, {
            family: family,
            style: style,
            weight: weight,
            italic: italic
        });
        return font;
    };

    function findFontSync(arg) {
        arg.style = arg.style || 'Regular';
        const availableFonts = FontManager.getAvailableFontsSync();
        let font = availableFonts[0];
        let match = availableFonts.filter(font => font.family === arg.family);
        font = match[0] || font;
        if (arg.italic != null) {
            match = match.filter(font => font.italic === arg.italic);
            font = match[0] || font;
        }
        match = match.filter(font => font.style === arg.style);
        font = match[0] || font;
        if (arg.weight != null) {
            match = match.filter(font => font.weight === arg.weight);
        }
        font = match[0] || font;
        return font;
    };

    const substitutedFamily = function($textElement){
        const fontFamily = $textElement.attr('font-family');
        const fontStyle = $textElement.attr('font-style');
        const text = $textElement.text();
        
        // Escape for Whitelists
        const whiteList = ['標楷體'];
        const whiteKeyWords = ['華康', 'Adobe'];
        if (whiteList.indexOf(fontFamily) >= 0) {
            return fontFamily;
        }
        for (let i = 0; i < whiteKeyWords.length; i++) {
            let keyword = whiteKeyWords[i];
            if (fontFamily.indexOf(keyword) >= 0) {
                return fontFamily;
            }
        }
        //if only contain basic character (123abc!@#$...), don't substitute.
        //because my Mac cannot substituteFont properly handing font like 'Windings'
        //but we have to subsittue text if text contain both English and Chinese
        const textOnlyContainBasicLatin = Array.from(text).every(char => {
            return char.charCodeAt(0) <= 0x007F;
        });
        if (textOnlyContainBasicLatin) {
            return fontFamily;
        }
        const originFont = findFontSync({
            family: fontFamily,
            style: fontStyle
        });
        // array of used family which are in the text
        
        const originPostscriptName = originFont.postscriptName;
        const fontList = Array.from(text).map(char =>
            FontManager.substituteFontSync(originPostscriptName, char)
        );
        let familyList = fontList.map(font => font.family);
        let postscriptList = fontList.map(font => font.postscriptName);
        // make unique
        familyList = [...new Set(familyList)];
        postscriptList = [...new Set(postscriptList)];

        if (familyList.length === 1) {
            return familyList[0];
        } else {
            // Test all found fonts if they contain all 
            
            for (let i = 0; i < postscriptList.length; ++i) {
                let allFit = true;
                for (let j = 0; j < text.length; ++j) {
                    if (fontList[j].postscriptName === postscriptList[i]) {
                        continue;
                    }
                    const foundfont = FontManager.substituteFontSync(postscriptList[i], text[j]).family;
                    if (familyList[i] !== foundfont) {
                        allFit = false;
                        break;
                    }
                }
                if (allFit) {
                    console.log(`Find ${familyList[i]} fit for all char`);
                    return familyList[i];
                }
            }
            console.log('Cannot find a font fit for all')
            return (familyList.filter(family => family !== fontFamily))[0];
        }
    };

    const convertTextToPathFluxsvg = async ($textElement, bbox) => {
        if (!$textElement.text()) {
            svgCanvas.clearSelection();
            $textElement.remove();
            return;
        }
        let batchCmd = new svgedit.history.BatchCommand('Text to Path');
        if (BeamboxPreference.read('font-substitute') !== false) {
            const newFontFamily = substitutedFamily($textElement);
            $textElement.attr('font-family', newFontFamily);
        }
        console.log($textElement.attr('font-family'));
        $textElement.removeAttr('stroke-width');
        await svgWebSocket.uploadPlainTextSVG($textElement, bbox);

        const isFill = (() => {
            if ($textElement.attr('fill-opacity') === 0) {
                return false;
            }
            const fillAttr = $textElement.attr('fill');
            if (['#fff', '#ffffff', 'none'].includes(fillAttr)) {
                return false;
            } else if(fillAttr || fillAttr === null) {
                return true;
            } else {
                return false;
            }
        })();

        const outputs = await svgWebSocket.divideSVG();
        let {pathD, transform} = await new Promise ((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onloadend = function (e) {
                let svgString = e.target.result;
                console.log(svgString);
                const pathD = svgString.match(/(?<= d=")[^"]+/g);
                const transform = svgString.match(/(?<= transform=")[^"]+/g);
                resolve({pathD, transform});
            }
            if (isFill) {
                fileReader.readAsText(outputs.data['colors']);
            } else {
                fileReader.readAsText(outputs.data['strokes']);
            }
        });
        if (!pathD) {
            return;
        }

        const path = document.createElementNS(window.svgedit.NS.SVG, 'path');
        let color = $textElement.attr('stroke');
        color = color !== 'none' ? color : $textElement.attr('fill');
        $(path).attr({
            'id': svgCanvas.getNextId(),
            'd': pathD.join(''),
            //Note: Assuming transform matrix for all d are the same
            'transform': transform ? transform[0] : '',
            'fill': isFill ? color : '#fff',
            'fill-opacity': isFill ? 1 : 0,
            'stroke': color,
            'stroke-opacity': 1,
            'stroke-dasharray': 'none',
            'vector-effect': 'non-scaling-stroke',
        });
        $(path).insertAfter($textElement);
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(path));
        const pbbox = path.getBBox();
        svgCanvas.moveElements([bbox.x + bbox.width - pbbox.x - pbbox.width], [bbox.y + bbox.height - pbbox.y - pbbox.height], [path], false);
        let textElem = $textElement[0];
        let parent = textElem.parentNode;
        let nextSibling = textElem.nextSibling;
        let elem = parent.removeChild(textElem);
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, parent));

        if (!batchCmd.isEmpty()) {
            svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }
    }

    const requestToConvertTextToPath = async ($textElement, family, weight, style) => {
        const d = $.Deferred();

        const fontStyle = requestFontByFamilyAndStyle({
            family: family,
            weight: weight,
            style:  style,
            italic: ($textElement.attr('font-style') === 'italic')
        }).style;

        const transform = $textElement.attr('transform') || '';

        const letterSpacing = (function() {
            const letterSpacingAttr = $textElement.attr('letter-spacing');
            if (!letterSpacingAttr) {
                return 0;
            } else {
                return letterSpacingAttr.replace('em', '');
            }
        })();

        // use key (which hash from $textElement html string) to prevent ipc event confliction
        const key = hashCode($textElement.prop('outerHTML'));
        ipc.once(events.RESOLVE_PATH_D_OF_TEXT + key, (sender, pathD) => {
            d.resolve(pathD);
        });

        ipc.send(events.REQUEST_PATH_D_OF_TEXT, {
            text: $textElement.text(),
            x: $textElement.attr('x'),
            y: $textElement.attr('y'),
            fontFamily: $textElement.attr('font-family'),
            fontSize: $textElement.attr('font-size'),
            fontStyle: fontStyle,
            letterSpacing: letterSpacing,
            key: key
        });
        const pathD = await d;

        const path = document.createElementNS(window.svgedit.NS.SVG, 'path');

        const isFill = (function(){
            if ($textElement.attr('fill-opacity') === 0) {
                return false;
            }
            const fillAttr = $textElement.attr('fill');
            if (['#fff', '#ffffff', 'none'].includes(fillAttr)) {
                return false;
            } else if(fillAttr || fillAttr === null) {
                return true;
            } else {
                return false;
            }
        })();
        let color = $textElement.attr('stroke');
        color = color !== 'none' ? color : $textElement.attr('fill');

        $(path).attr({
            'id': svgCanvas.getNextId(),
            'd': pathD,
            'transform': transform,
            'fill': isFill ? color : '#fff',
            'fill-opacity': isFill ? 1 : 0,
            'stroke': color,
            'stroke-opacity': 1,
            'stroke-dasharray': 'none',
            'vector-effect': 'non-scaling-stroke',
        });

        let batchCmd = new svgedit.history.BatchCommand('Text to Path');
        $(path).insertAfter($textElement);
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(path));
        let textElem = $textElement[0];
        let parent = textElem.parentNode;
        let nextSibling = textElem.nextSibling;
        let elem = parent.removeChild(textElem);
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, parent));

        if (!batchCmd.isEmpty()) {
            svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }

        return;
    };

    const convertTextToPathAmoungSvgcontent = async () => {
        //FnWrapper.reset_select_mode();
        const convertByFluxsvg = BeamboxPreference.read('TextbyFluxsvg') !== false;
        if (convertByFluxsvg) {
            const texts = $('#svgcontent').find('text').toArray()
            for (let i = 0; i < texts.length; ++i) {
                let el = texts[i];
                let bbox = svgCanvas.calculateTransformedBBox($(el)[0]);
                await convertTextToPathFluxsvg($(el), bbox);
            }
            return;
        } else {
            const allPromises = $('#svgcontent')
                .find('text')
                .toArray()
                .map(
                    el => requestToConvertTextToPath($(el))
                );
            return await Promise.all(allPromises);
        }
    };

    // <Map> family -> fullName
    const fontNameMap = (function requestEachFontFullname() {
        if (activeLang !== 'zh-tw') {
            return new Map(
                availableFontFamilies.map(family => [family, family])
            );
        }

        const nameMap = new Map([
            ['Hannotate TC', '手扎體-繁'],
            ['Hannotate SC', '手扎體-簡'],
            ['Hiragino Sans GB', '冬青黑體簡體中文'],
            ['STFangsong', '華文仿宋'],
            ['STSong', '華文宋體'],
            ['STXihei', '華文黑體'],
            ['STKaiti', '華文楷體'],
            ['Songti TC', '宋體-繁'],
            ['Songti SC', '宋體-簡'],
            ['Heiti TC', '黑體-繁'],
            ['Heiti SC', '黑體-簡'],
            ['PingFang HK', '蘋方-繁'],
            ['PingFang TC', '蘋方-繁'],
            ['PingFang SC', '蘋方-簡'],
            ['Xingkai TC', '行楷-繁'],
            ['Xingkai SC', '行楷-簡'],
            ['Wawati TC', '娃娃體-繁'],
            ['Wawati SC', '娃娃體-簡'],
            ['LingWai TC', '凌慧體-繁'],
            ['LingWai SC', '凌慧體-簡'],
            ['Baoli TC', '報隸-繁'],
            ['Baoli SC', '報隸-簡'],
            ['Yuppy TC', '雅痞-繁'],
            ['Yuppy SC', '雅痞-簡'],
            ['Yuanti TC', '圓體-繁'],
            ['Yuanti SC', '圓體-簡'],
            ['Kaiti TC', '楷體-繁'],
            ['Kaiti SC', '楷體-簡'],
            ['HanziPen TC', '翩翩體-繁'],
            ['HanziPen SC', '翩翩體-簡'],
            ['Libian TC', '隸變-繁'],
            ['Libian SC', '隸變-簡'],
            ['Weibei TC', '魏碑-繁'],
            ['Weibei SC', '魏碑-簡'],
            ['Lantinghei TC', '蘭亭黑-繁'],
            ['Lantinghei SC', '蘭亭黑-簡'],
            ['Apple LiSung Light', '蘋果儷細宋'],

            ['SimSun', '宋體'],
            ['SimHei', '黑體'],
            ['Microsoft YaHei', '微軟雅黑'],
            ['Microsoft JhengHei', '微軟正黑體'],
            ['NSimSun', '新宋體'],
            ['PMingLiU', '新细明體'],
            ['MingLiU', '细明體'],
            ['DFKai-SB', '標楷體'],
            ['FangSong', '仿宋'],
            ['KaiTi', '楷體'],
            ['FangSong_GB2312', '仿宋_GB2312'],
            ['KaiTi_GB2312', '楷體_GB2312'],
            ['STHeiti Light [STXihei]', '華文细黑'],
            ['STHeiti', '華文黑體'],
            ['STKaiti', '華文楷體'],
            ['STSong', '華文宋體'],
            ['STFangsong', '華文仿宋'],
            ['LiHei Pro Medium', '儷黑 Pro'],
            ['LiSong Pro Light', '儷宋 Pro'],
            ['BiauKai', '標楷體'],
            ['Apple LiGothic Medium', '蘋果儷中黑'],
            ['Apple LiSung Light', '蘋果儷細宋'],

            ['PMingLiU', '新細明體'],
            ['MingLiU', '細明體'],
            ['DFKai-SB', '標楷體'],
            ['SimHei', '黑體'],
            ['NSimSun', '新宋體'],
            ['FangSong', '仿宋'],
            ['KaiTi', '楷體'],
            ['FangSong_GB2312', '仿宋_GB2312'],
            ['KaiTi_GB2312', '楷體_GB2312'],
            ['Microsoft JhengHei', '微軟正黑體'],
            ['Microsoft YaHei', '微軟雅黑體'],

            ['LiSu', '隸書'],
            ['YouYuan', '幼圓'],
            ['STXihei', '華文细黑'],
            ['STKaiti', '華文楷體'],
            ['STSong', '華文宋體'],
            ['STZhongsong', '華文中宋'],
            ['STFangsong', '華文仿宋'],
            ['FZShuTi', '方正舒體'],
            ['FZYaoti', '方正姚體'],
            ['STCaiyun', '華文彩云'],
            ['STHupo', '華文琥珀'],
            ['STLiti', '華文隸書'],
            ['STXingkai', '華文行楷'],
            ['STXinwei', '華文新魏'],
        ]);

        return new Map(
            availableFontFamilies.map(family => {
                return [family, nameMap.get(family) || family];
            })
        );
    })();
    return {
        availableFontFamilies: availableFontFamilies,
        fontNameMap: fontNameMap,
        requestFontStylesOfTheFontFamily: requestFontStylesOfTheFontFamily,
        requestFontByFamilyAndStyle: requestFontByFamilyAndStyle,
        requestToConvertTextToPath: requestToConvertTextToPath,
        convertTextToPathFluxsvg: convertTextToPathFluxsvg,
        convertTextToPathAmoungSvgcontent: convertTextToPathAmoungSvgcontent
    };
});
