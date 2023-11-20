import cython
cdef extern from "nanosvg.h":
    cdef struct NSVGpath:
        char closed
        float* pts
        int npts
        NSVGpath* next
    cdef struct NSVGshape:
        char id[64]
        NSVGpath* paths
        NSVGshape* next

    ctypedef struct NSVGimage:
        float width
        float height
        NSVGshape* shapes

    NSVGimage* nsvgParse(char* input, const char* units, float dpi);

def distPtSeg(float x, float y, float px, float py, float qx, float qy):
    cdef float pqx, pqy, dx, dy, d, t
    pqx = qx-px
    pqy = qy-py
    dx = x-px
    dy = y-py
    d = pqx*pqx + pqy*pqy
    t = pqx*dx + pqy*dy
    if d > 0:
        t = t/d
    if t < 0:
        t = 0
    elif t > 1:
        t = 1
    dx = px + t*pqx - x
    dy = py + t*pqy - y
    return dx*dx + dy*dy

def cubicBez(float x1, float y1, float x2, float y2,float x3, float y3, float x4, float y4,float tol, int level):
    cdef float x12,y12,x23,y23,x34,y34,x123,y123,x234,y234,x1234,y1234
    cdef float d
    if level > 12:
        return []

    x12 = (x1 + x2) * 0.5
    y12 = (y1 + y2) * 0.5
    x23 = (x2+x3)*0.5
    y23 = (y2+y3)*0.5
    x34 = (x3+x4)*0.5
    y34 = (y3+y4)*0.5
    x123 = (x12+x23)*0.5
    y123 = (y12+y23)*0.5
    x234 = (x23+x34)*0.5
    y234 = (y23+y34)*0.5
    x1234 = (x123+x234)*0.5
    y1234 = (y123+y234)*0.5
    d = distPtSeg(x1234, y1234, x1,y1, x4,y4)
    if d > tol*tol:
        point_lst = []
        a = cubicBez(x1,y1, x12,y12, x123,y123, x1234,y1234, tol, level+1)
        b = cubicBez(x1234,y1234, x234,y234, x34,y34, x4,y4, tol, level+1)
        point_lst.extend(a)
        point_lst.extend(b)
        return point_lst
    else:

        return [(x4,y4)]

cpdef get_all_points(char* svg_data):
    cdef NSVGimage* g_image
    cdef NSVGpath * path
    cdef float* p
    cdef int i
    cdef float cx,cy,hw,hh
    cdef float width,height
    cdef float view_2,view_1,px,aspect
    g_image = nsvgParse(svg_data, "px", 96.0)

    cx = g_image.width * 0.5
    cy = g_image.height * 0.5
    hw = g_image.width * 0.5
    hh = g_image.height * 0.5
    width = 1880.0
    height = 955.0
    if width/hw < height/hh:
        aspect = height / width
        view_2 = cx + hw * 1.2
        view_1 = cy - hw * 1.2 * aspect

    else:
        aspect = width / height
        view_2 = cx + hh * 1.2 * aspect
        view_1 = cy - hh * 1.2

    px = (view_2 - view_1) / width;

    cdef NSVGshape * shape = g_image.shapes
    path_lst = []
    while shape != NULL:
        path = shape.paths
        while path != NULL:
            point_lst = []
            p = path.pts
            point_lst.append((p[0],p[1]))
            for i in range(0,path.npts-1,3):
                p = path.pts + i*2
                #point_lst.extend(cubicBez(p[0],p[1], p[2],p[3], p[4],p[5], p[6],p[7], px * 1.5, 0))
                point_lst.extend(cubicBez(p[0],p[1], p[2],p[3], p[4],p[5], p[6],p[7], px * 0.001, 0))
            #if path.closed:
                #point_lst.append((path.pts[0],path.pts[1]))
            path_lst.append(point_lst)
            path = path.next
        shape = shape.next
    return path_lst
