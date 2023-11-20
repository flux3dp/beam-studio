from cython.operator cimport dereference as deref, preincrement as inc
import sys

cdef extern from "<vector>" namespace "std":
    cdef cppclass vector[T]:
        cppclass iterator:
            T operator*()
            iterator operator++()
            bint operator==(iterator)
            bint operator!=(iterator)
        vector()
        void push_back(T&)
        T& operator[](int)
        T& at(int)
        iterator end()
        iterator begin()
        int size()

cdef extern from "beamify_matrix.hpp": 
    cdef cppclass BeamifyMatrix:
        BeamifyMatrix() except +
        void set_identity();
        void set_translation(float tx, float ty);
        void set_scale(float sx, float sy);
        void set_skew_x(float a);
        void set_skew_y(float a);
        void set_rotation(float a);
        void multiply(BeamifyMatrix& s);
        void copy(BeamifyMatrix& s);
        void inverse(BeamifyMatrix& inv);
        void premultiply(BeamifyMatrix& s);
        void transform_point(float* dx, float* dy, float x, float y);
        void vec(float* dx, float* dy, float x, float y);
        float data[9];

cdef extern from "beamify_line.hpp": 
    cdef cppclass BeamifyPoint:
        float x;
        float y;
        char type;
        
    cdef cppclass BeamifyLine:
        vector[BeamifyPoint] points

cdef extern from "beamify_path.hpp": 
    cdef cppclass BeamifyPath:
        vector[BeamifyLine] lines


cdef extern from "beamify_context.hpp": 
    cdef cppclass BeamifyContext:
        BeamifyContext() except +
        vector[BeamifyLine] sorted_result
        void save();
        void restore();
        void begin_path();
        void close_path();
        void move_to(float x, float y);
        void rel_move_to(float x, float y);
        void line_to(float x, float y);
        void rel_line_to(float x, float y);
        void ellipse(float cx, float cy, float rx, float ry);
        void circle(float cx, float cy, float r);
        void arc(float cx, float cy, float r, float angle1, float angle2);
        void arc_negative(float cx, float cy, float r, float angle1, float angle2);
        void ellipse_arc(float rx, float ry, float rotx, int large_arc, int sweep, float _dx, float _dy);
        void curve_to(float x1, float y1, float x2, float y2, float x3, float y3);
        void rel_curve_to(float x1, float y1, float x2, float y2, float x3, float y3);
        void rectangle(float x, float y, float w, float h);
        void rotate(float a);
        void translate(float x, float y);
        void scale(float x, float y);
        void transform(BeamifyMatrix& matrix);
        void set_compensation_length(float val);
        void clip();
        void stroke();
        void output();
        void sort();
        void set_color(unsigned char r, unsigned char g, unsigned char b);
        void set_dash(float* dashes, float dash_offset);
        void hide_path();

cdef class Context:
    cdef BeamifyContext beamify_context      # hold a C++ instance which we're wrapping
    cdef char ready

    def __cinit__(self):
        self.ready = 1

    def save(self):
        self.beamify_context.save()

    def restore(self):
        self.beamify_context.restore()

    def new_path(self):
        self.begin_path()

    def begin_path(self):
        self.beamify_context.begin_path()

    def close_path(self):
        self.beamify_context.close_path()

    def clip(self):
        self.beamify_context.clip()

    def move_to(self, x, y):
        self.beamify_context.move_to(x, y)
    
    def rel_move_to(self, x, y):
        self.beamify_context.rel_move_to(x, y)

    def line_to(self, x, y):
        self.beamify_context.line_to(x, y)
    
    def rel_line_to(self, x, y):
        self.beamify_context.rel_line_to(x, y)
    
    def set_dash(self, dashes, offset):
        cdef float cdashes[200]
        cdef float coffset = offset
        for i in range(len(dashes)):
            cdashes[i] = dashes[i]
        cdashes[len(dashes)] = -1
        self.beamify_context.set_dash(cdashes, coffset)

    def stroke(self):
        self.beamify_context.stroke()

    def output(self):
        self.beamify_context.output()

    def sort(self):
        self.beamify_context.sort()

    def ellipse(self, cx, cy, rx, ry):
        self.beamify_context.ellipse(cx, cy, rx, ry)

    def circle(self, cx, cy, r):
        self.beamify_context.circle(cx, cy, r)

    def arc(self, cx, cy, r, angle1, angle2):
        self.beamify_context.arc(cx, cy, r, angle1, angle2)

    def arc_negative(self, cx, cy, r, angle1, angle2):
        self.beamify_context.arc_negative(cx, cy, r, angle1, angle2)

    def ellipse_arc(self, rx, ry, rotx, large_arc, sweep, _dx, _dy):
        self.beamify_context.ellipse_arc(rx, ry, rotx, large_arc, sweep, _dx, _dy)

    def curve_to(self, x1, y1, x2, y2, x3, y3):
        self.beamify_context.curve_to(x1, y1, x2, y2, x3, y3)
    
    def rel_curve_to(self, x1, y1, x2, y2, x3, y3):
        self.beamify_context.rel_curve_to(x1, y1, x2, y2, x3, y3)

    def rectangle(self, x, y, w, h):
        self.beamify_context.rectangle(x, y, w, h)

    def rotate(self, a):
        self.beamify_context.rotate(a)

    def translate(self, x, y):
        self.beamify_context.translate(x, y)

    def scale(self, x, y):
        self.beamify_context.scale(x, y)
    
    def transform(self, s):
        cdef Matrix m = s
        self.beamify_context.transform(m.beamify_matrix)
    
    def set_compensation_length(self, val):
        self.beamify_context.set_compensation_length(val)

    def get_array(self):
        cdef int line_count = 0
        cdef int line_size = self.beamify_context.sorted_result.size()
        
        shapes = []
        shape = []

        while line_count < line_size:
            pts = []
            pt_count = 0
            pt_size = self.beamify_context.sorted_result[line_count].points.size()
            # sys.stderr.write("Parsing Line " + str(line_count) + "," + str(pt_size) + "\n")
            while pt_count < pt_size:
                p = self.beamify_context.sorted_result[line_count].points[pt_count]
                pts.append((p.x, p.y))
                pt_count = pt_count +1
            line_count = line_count + 1
            shape.append(pts)
        shapes.append(shape)
        return shapes

    def set_source_rgba(self, r, g, b, a):
        self.beamify_context.set_color(r * 255, g * 255, b * 255)

    def hide_path(self):
        self.beamify_context.hide_path()

cdef class Matrix:
    cdef BeamifyMatrix beamify_matrix      # hold a C++ instance which we're wrapping
    cdef char ready

    def __cinit__(self):
        self.ready = 1

    def set_value(self, a, b, c, d, e ,f):
        self.beamify_matrix.data[0] = a
        self.beamify_matrix.data[1] = b
        self.beamify_matrix.data[2] = c
        self.beamify_matrix.data[3] = d
        self.beamify_matrix.data[4] = e
        self.beamify_matrix.data[5] = f
    
    def data(self):
        return [self.beamify_matrix.data[0],
        self.beamify_matrix.data[1],
        self.beamify_matrix.data[2],
        self.beamify_matrix.data[3],
        self.beamify_matrix.data[4],
        self.beamify_matrix.data[5]]

    def set_identity(self):
        self.beamify_matrix.set_identity()

    def translate(self, tx, ty):
        cdef BeamifyMatrix m
        m.set_translation(tx, ty)
        self.beamify_matrix.premultiply(m)

    def scale(self, sx, sy):
        cdef BeamifyMatrix m
        m.set_scale(sx, sy)
        self.beamify_matrix.premultiply(m)

    def skew_x(self, a):
        cdef BeamifyMatrix m
        m.set_skew_x(a)
        self.beamify_matrix.premultiply(m)

    def skew_y(self, a):
        cdef BeamifyMatrix m
        m.set_skew_y(a)
        self.beamify_matrix.premultiply(m)

    def rotate(self, a):
        cdef BeamifyMatrix m
        m.set_rotation(a)
        self.beamify_matrix.premultiply(m)

    def multiply(self, s):
        cdef Matrix m = s
        self.beamify_matrix.multiply(m.beamify_matrix)

    def copy(self, s):
        cdef Matrix m = s
        self.beamify_matrix.copy(m.beamify_matrix)

    def inverse(self, inv):
        cdef Matrix m = inv
        self.beamify_matrix.inverse(m.beamify_matrix)

    def premultiply(self, s):
        cdef Matrix m = s
        self.beamify_matrix.premultiply(m.beamify_matrix)