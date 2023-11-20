import json

from libc.math cimport isnan, NAN
from libcpp cimport bool
from libcpp.string cimport string
from libcpp.vector cimport vector
from libcpp.pair cimport pair
from _toolpathlib cimport (ToolpathProcessor as _ToolpathProcessor,
                           GCodeParser as _GCodeParser,
                           GCodeMemoryWriter as _GCodeMemoryWriter,
                           GCodeFileWriter as _GCodeFileWriter,
                           FCodeV1MemoryWriter as _FCodeV1MemoryWriter,
                           FCodeV1FileWriter as _FCodeV1FileWriter,
                           FCodeV2MemoryWriter as _FCodeV2MemoryWriter,
                           PythonToolpathProcessor)

from libc.math cimport floor, ceil

import numpy as np
cimport numpy as np

DTYPE = np.uint8
ctypedef np.uint8_t NP_CHAR

cdef class ToolpathProcessor:
    cdef _ToolpathProcessor *_proc
    cdef float _y_ratio
    cdef float _y_ref

    def __init__(self):
        self._y_ref = 0.0
        self._y_ratio = 1.0

    def __dealloc__(self):
        if self._proc:
            del self._proc
            self._proc = NULL
    
    cpdef set_y_rotary(self, float ref, float ratio):
        self._y_ref = ref
        self._y_ratio = ratio
    

    cpdef moveto(self, float feedrate=NAN, float x=NAN, float y=NAN, float z=NAN, float s=NAN):
        cdef int flags = 0
        if not isnan(feedrate):
            flags |= 64
        if not isnan(x):
            flags |= 32
        if not isnan(y):
            if self._y_ratio != 1.0:
                y = (y - self._y_ref) * self._y_ratio + self._y_ref
            flags |= 16
        if not isnan(z):
            flags |= 8
        if not isnan(s):
            flags |= 1
        self._proc.moveto(flags, feedrate, x, y, z, s)

    cpdef sleep(self, float seconds):
        self._proc.sleep(seconds)

    cpdef enable_motor(self):
        self._proc.enable_motor()

    cpdef disable_motor(self):
        self._proc.disable_motor()

    cpdef pause(self, bool to_standby_position):
        self._proc.pause(to_standby_position)

    cpdef home(self):
        self._proc.home()

    cpdef set_toolhead_heater_temperature(self, float temperature, bool wait):
        self._proc.set_toolhead_heater_temperature(temperature, wait)

    cpdef set_toolhead_fan_speed(self, float strength):
        self._proc.set_toolhead_fan_speed(strength)

    cpdef set_toolhead_pwm(self, float strength):
        self._proc.set_toolhead_pwm(strength)
    
    cpdef dwell_cmd(self, int milli_second):
        self._proc.dwell_cmd(milli_second)

    cpdef set_toolhead_laser_module(self, int laser_type):
        self._proc.set_toolhead_laser_module(laser_type)
    
    cpdef set_calibrate(self):
        self._proc.set_calibrate()

    cpdef turn_on_gradient_print_mode(self, resolution):
        self._proc.turn_on_gradient_print_mode(resolution)

    cpdef turn_off_gradient_print_mode(self):
        self._proc.turn_off_gradient_print_mode()

    cpdef set_line_pixels(self, int pixel_number):
        self._proc.set_line_pixels(pixel_number)

    cpdef fill_32_pixels(self, unsigned pixels):
        self._proc.fill_32_pixels(pixels)

    cpdef set_time_est_acc_x(self, unsigned acc):
        self._proc.set_time_est_acc_x(acc)

    cpdef set_fill_end(self):
        self._proc.set_fill_end()

    cpdef set_print_line_status(self):
        self._proc.set_print_line_status()
    
    cpdef enter_printer_mode(self):
        self._proc.enter_printer_mode()

    cpdef wait_printer_mode_sync(self):
        self._proc.wait_printer_mode_sync()

    cpdef exit_printer_mode(self):
        self._proc.exit_printer_mode()
    
    # 0x02 for image packet, 0x11 for nozzle settings packet
    cpdef start_printer_packet(self, unsigned packet_type):
        self._proc.start_printer_packet(packet_type)
    
    cpdef end_printer_packet(self):
        self._proc.end_printer_packet()
    
    cpdef set_printer_packet_px_count(self, unsigned count):
        self._proc.set_printer_packet_px_count(count)

    cpdef set_printer_packet_length(self, unsigned length):
        self._proc.set_printer_packet_length(length)
    
    cpdef start_printer_packet_payload(self):
        self._proc.start_printer_packet_payload()

    cpdef add_printer_packet_payload(self, unsigned byte):
        self._proc.add_printer_packet_payload(byte)
    
    cpdef set_printer_packet_crc(self, unsigned val):
        self._proc.set_printer_packet_crc(val)
    
    # M137[val]
    cpdef sync_grbl_motion(self, unsigned val):
        self._proc.sync_grbl_motion(val)
    
    # M136P[val]
    cpdef flux_custom_cmd(self, unsigned val):
        self._proc.flux_custom_cmd(val)
    
    cpdef user_selection_cmd(self, unsigned cmd):
        self._proc.one_seg_custom_cmd(20, cmd)
    
    cpdef miscellaneous_cmd(self, unsigned cmd):
        self._proc.one_seg_custom_cmd(21, cmd)
    
    cpdef grbl_system_cmd(self, unsigned cmd):
        self._proc.one_seg_custom_cmd(22, cmd)
    
    cpdef end_content(self):
        self._proc.end_content()
    
    # data: JSON serializable string
    cpdef write_post_config(self, data):
        data_string = json.dumps(data, separators=(',', ':'))
        cdef bytes c = data_string.encode()
        self._proc.write_post_config(c, len(c))
    
    cpdef write_string(self, str s, bool write_length = False):
        cdef bytes c = s.encode()
        self._proc.write_string(c, len(c), write_length)
    
    def write_task_preview(self, image_bytes_io):
        cdef bytes c = image_bytes_io.getvalue()
        self.write_string('PREV')
        self._proc.write_string(c, len(c), True)

    cpdef start_task_script_block(self, str header, str proc_id):
        cdef bytes h = header.encode()
        cdef bytes p = proc_id.encode()
        if not proc_id:
            self._proc.start_task_script_block(h, NULL)
        else:
            self._proc.start_task_script_block(h, p)
    
    cpdef end_task_script_block(self):
        self._proc.end_task_script_block()

    cpdef append_comment(self, comment):
        cdef bytes c = comment.encode()
        self._proc.append_comment(c, len(c))

    cpdef on_error(self, bool critical, str message):
        cdef bytes cmessage = message.encode()
        self._proc.on_error(critical, cmessage, len(cmessage))

    cpdef terminated(self):
        self._proc.terminated()


cdef class PyToolpathProcessor(ToolpathProcessor):
    cdef object pvgc

    def __init__(self, callback):
        super().__init__()
        self.pvgc = callback
        self._proc = <_ToolpathProcessor*>new PythonToolpathProcessor(self.pvgc)


cdef class GCodeMemoryWriter(ToolpathProcessor):
    def __init__(self):
        super().__init__()
        self._proc = <_ToolpathProcessor*>new _GCodeMemoryWriter()

    def get_buffer(self):
        # TODO
        # cdef const string& swap = (<_GCodeMemoryWriter*>self._proc).get_buffer()
        # return swap.c_str()[:swap.size()]
        cdef string swap = (<_GCodeMemoryWriter*>self._proc).get_buffer()
        return swap.c_str()[:swap.size()]


cdef class GCodeFileWriter(ToolpathProcessor):
    def __init__(self, filename):
        super().__init__()
        self._proc = <_ToolpathProcessor*>new _GCodeFileWriter(filename.encode())


cdef class FCodeV1MemoryWriter(ToolpathProcessor):
    cdef string headtype
    cdef vector[pair[string, string]] metadata
    cdef vector[string] previews

    def __init__(self, head_type, metadata, previews):
        super().__init__()
        self.headtype = head_type.encode()
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        self.previews = previews
        self._proc = <_ToolpathProcessor*>new _FCodeV1MemoryWriter(&self.headtype,
            &self.metadata, &self.previews)

    def get_buffer(self):
        # TODO
        # cdef const string& swap = (<_FCodeV1MemoryWriter*>self._proc).get_buffer()
        # return swap.c_str()[:swap.size()]
        cdef string swap = (<_FCodeV1MemoryWriter*>self._proc).get_buffer()
        return swap.c_str()[:swap.size()]

    def set_metadata(self, metadata):
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        (<_FCodeV1MemoryWriter*>self._proc).metadata = &self.metadata

    def set_previews(self, previews):
        self.previews = previews
        (<_FCodeV1MemoryWriter*>self._proc).previews = &self.previews

    def get_metadata(self):
        return dict(self.metadata)

    def get_traveled(self):
        return (<_FCodeV1MemoryWriter*>self._proc).traveled

    def get_time_cost(self):
        return (<_FCodeV1MemoryWriter*>self._proc).time_cost

    def errors(self):
        return (<_FCodeV1MemoryWriter*>self._proc).errors


cdef class FCodeV1FileWriter(ToolpathProcessor):
    cdef string filename, headtype
    cdef vector[pair[string, string]] metadata
    cdef vector[string] previews

    def __init__(self, filename, head_type, metadata, previews):
        super().__init__()
        self.filename = filename.encode()
        self.headtype = head_type.encode()
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        self.previews = previews
        self._proc = <_ToolpathProcessor*>new _FCodeV1FileWriter(self.filename.c_str(), &self.headtype,
            &self.metadata, &self.previews)

    def set_metadata(self, metadata):
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        (<_FCodeV1FileWriter*>self._proc).metadata = &self.metadata

    def set_previews(self, previews):
        self.previews = previews
        (<_FCodeV1FileWriter*>self._proc).previews = &self.previews

    def get_metadata(self):
        return dict(self.metadata)

    def errors(self):
        return (<_FCodeV1FileWriter*>self._proc).errors


cdef class FCodeV2MemoryWriter(ToolpathProcessor):
    cdef string headtype
    cdef vector[pair[string, string]] metadata
    cdef vector[string] previews

    def __init__(self, metadata, previews):
        super().__init__()
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        self.previews = previews
        self._proc = <_ToolpathProcessor*>new _FCodeV2MemoryWriter(&self.metadata, &self.previews)

    def get_buffer(self):
        cdef string swap = (<_FCodeV2MemoryWriter*>self._proc).get_buffer()
        return swap.c_str()[:swap.size()]

    def set_metadata(self, metadata):
        self.metadata = ((k.encode(), v.encode()) for k, v in metadata.items())
        (<_FCodeV2MemoryWriter*>self._proc).metadata = &self.metadata

    def set_previews(self, previews):
        self.previews = previews
        (<_FCodeV2MemoryWriter*>self._proc).previews = &self.previews

    def get_metadata(self):
        return dict(self.metadata)

    def get_traveled(self):
        return (<_FCodeV2MemoryWriter*>self._proc).traveled

    def get_time_cost(self):
        return (<_FCodeV2MemoryWriter*>self._proc).time_cost

    def errors(self):
        return (<_FCodeV2MemoryWriter*>self._proc).errors
    
    def write_task_info(self, layer_info):
        layer_info['time_cost'] = round((<_FCodeV2MemoryWriter*>self._proc).current_task_time_cost, 2)
        layer_info['travel_dist'] = round((<_FCodeV2MemoryWriter*>self._proc).current_task_traveled, 2)
        data = json.dumps(layer_info, separators=(',', ':'))
        self.write_string('INFO')
        self.write_string(data, True)


cdef class GCodeParser:
    cdef _GCodeParser *_parser

    def __cinit__(self):
        self._parser = new _GCodeParser()

    def __dealloc__(self):
        del self._parser

    cdef set_c_processor(self, _ToolpathProcessor *proc):
        self._parser.set_processor(proc)

    cpdef set_processor(self, ToolpathProcessor py_proc):
        self.set_c_processor(py_proc._proc)

    cpdef parse_command(self, bytes command):
        self._parser.parse_command(command, len(command))

    cpdef parse_from_file(self, filename):
        self._parser.parse_from_file(filename.encode())

# gcode image (binary image)
cdef bool iterate_x_c(
    np.ndarray[NP_CHAR, ndim=1] data, # False for black, True for white
    proc=None,
    reverse=False,
    offset_x=0,
    y=0,
    vel=6000, # mm / min
    acc=4000, # mm / s^2
    pixel_size=0.05,
    max_x=400,
    mock_fast_gradient=False,
    min_padding=10, # mm
    backlash=0, # mm
):
    cdef int xmax = data.shape[0]
    cdef int current_laser_val = 0
    cdef bool has_moved_x = False, has_moved_y = False
    cdef int current_x = -1

    x_range = range(0, xmax) if not reverse else range(xmax - 1, -1, -1)
    for x in x_range:
        laser_value = 1 if not data[x] else 0

        if laser_value == 0:
            if current_laser_val != 0:
                current_laser_val = 0
                current_x = x
                real_x = pixel_size * (x if not reverse else x + 1) - offset_x
                if reverse:
                    real_x += backlash
                real_x = max(real_x, 0)
                proc.moveto(x=real_x)
                has_moved = True
                proc.set_toolhead_pwm(0)
        else:
            if current_laser_val == 0:
                # If not y is not moved, this will be the first point engraved on this line
                if not has_moved_y:
                    # So we need to move y to here
                    proc.set_toolhead_pwm(0)
                    # And by adding speed+1 hack, machine will refresh the speed value
                    proc.moveto(y=y, feedrate=vel + 1)
                    proc.moveto(feedrate=vel)
                    has_moved_y = True
                current_laser_val = 1
                current_x = x
                has_moved_x = True

                real_x = pixel_size * (x if not reverse else x + 1) - offset_x
                if reverse:
                    real_x += backlash
                real_x = max(real_x, 0)
                proc.moveto(x=real_x)
                # Setting laser off -> on
                proc.set_toolhead_pwm(100)
            else:
                current_x = x
                has_moved_x = False

    if current_x >= 0:
        real_x = pixel_size * (current_x if not reverse else current_x + 1) - offset_x
        if reverse:
            real_x += backlash
        real_x = max(real_x, 0)
        if not has_moved_x:
            proc.moveto(x=real_x)

        v_in_s = vel / 60
        acc_dist = (v_in_s ** 2) / (2 * acc)
        laser_padding = acc_dist if mock_fast_gradient else 25
        min_padding = max(min_padding, 0)
        laser_padding = max(laser_padding, min_padding)
        if not reverse:
            buffer_x = min(real_x + laser_padding, max_x)
        else:
            buffer_x = max(real_x - laser_padding, 0)
        proc.set_toolhead_pwm(0)
        proc.moveto(x=buffer_x)
    return current_x >= 0

# fast gradient (binary image)
cdef bool fg_iterate_x_c(
    np.ndarray[NP_CHAR, ndim=1] data, # False for black, True for white
    proc=None,
    reverse=False,
    offset_x=0,
    y=0,
    vel=6000, # mm / min
    acc=4000, # mm / s^2
    pixel_size=0.05, # mm / px
    min_padding=10, # mm
    backlash = 0, # mm
):
    cdef int i
    cdef int xmax = data.shape[0]
    cdef float v_in_s = vel / 60
    cdef float c_offset_x = offset_x
    min_padding = max(min_padding, 0)
    acc_dist = max((v_in_s ** 2) / (2 * acc), min_padding)
    init_blank_pixels = int(acc_dist / pixel_size)
    first_zero_index = None
    last_zero_index = None
    for i in range(0, xmax):
        if not data[i]:
            if first_zero_index is None:
                first_zero_index = i
            last_zero_index = i
    if first_zero_index is None:
        return False
    left = max(0, first_zero_index - init_blank_pixels)
    right = min(xmax - 1, last_zero_index + init_blank_pixels)
    pixel_number = right - left + 1
    left_x = pixel_size * left - c_offset_x # dpi related
    right_x = pixel_size * (right + 1) - c_offset_x # dpi related
    if not reverse:
        left_x += backlash
        right_x += backlash
    proc.moveto(x=left_x if not reverse else right_x, y=y, feedrate=vel + 1)
    proc.moveto(feedrate=vel)
    proc.set_line_pixels(pixel_number)

    x_range = range(left, right + 1) if not reverse else range(right, left - 1, -1)
    output = []
    current_val = 0
    bit_idx = 31
    for i in x_range:
        if not data[i]:
            current_val |= 1 << bit_idx
        bit_idx -= 1
        if bit_idx < 0:
            bit_idx = 31
            output.append(current_val)
            proc.fill_32_pixels(current_val)
            current_val = 0
    if bit_idx != 31:
        output.append(current_val)
        proc.fill_32_pixels(current_val)
    proc.set_fill_end()
    proc.set_print_line_status()
    proc.moveto(x=right_x if not reverse else left_x)
    return True


cdef int get_first_point_c(np.ndarray[NP_CHAR, ndim=1] data):
    cdef int xmax = data.shape[0], x
    for x in range(0, xmax):
        if not data[x]:
            return x
    return -1


cdef class LaserImageProcessor:
    @staticmethod
    def iterate_x(
        np.ndarray[NP_CHAR, ndim=1] data,
        processor=None,
        reverse=False,
        offset_x=0,
        y=0,
        vel=6000,
        acc=4000,
        pixel_size=0.05,
        max_x=400,
        mock_fast_gradient=False,
        min_padding=10,
        backlash=0,
    ):
        return iterate_x_c(data, processor, reverse, offset_x, y, vel, acc, pixel_size, max_x, mock_fast_gradient, min_padding, backlash)

    @staticmethod
    def fg_iterate_x(
        np.ndarray[NP_CHAR, ndim=1] data,
        processor=None,
        reverse=False,
        offset_x=0,
        y=0,
        vel=6000,
        acc=4000,
        pixel_size=0.05,
        min_padding=10,
        backlash=0
    ):
        return fg_iterate_x_c(data, processor, reverse, offset_x, y, vel, acc, pixel_size, min_padding, backlash)

    @staticmethod
    def get_first_point(np.ndarray[NP_CHAR, ndim=1] data):
        return get_first_point_c(data)


cdef preprocess_box_data_c(
    np.ndarray[NP_CHAR, ndim=2] data,
    np.ndarray[np.int16_t, ndim=2] val_table,
    np.ndarray[np.int8_t, ndim=2] cnt_table,
    x,
    y,
    w,
    h,
):
    for c in range(x, x + w):
        val = None
        count = None
        for r in range(y - 1, y + h):
            if val_table[r][c] >= 0:
                val = val_table[r][c]
                count = cnt_table[r][c]
                continue
            if val is None:
                if r >= 0 and val_table[r - 1][c] >= 0:
                    val = val_table[r - 1][c]
                    count = cnt_table[r - 1][c]
                else:
                    val = 0
                    count = 0
                    for i in range(8):
                        if r - 8 + i >= 0 and data[r - 8 + i][c] == False:
                            val += 1 << i
                            count += 1
            if val % 2 == 1:
                count -= 1
            val //= 2
            if data[r][c] == False:
                val += 128
                count += 1
            val_table[r][c] = val
            cnt_table[r][c] = count


cdef class PrintImageProcess:
    @staticmethod
    def preprocess_box_data(
        np.ndarray[NP_CHAR, ndim=2] data,
        np.ndarray[np.int16_t, ndim=2] val_table,
        np.ndarray[np.int8_t, ndim=2] cnt_table,
        x,
        y,
        w,
        h,
    ):
        return preprocess_box_data_c(data, val_table, cnt_table, x, y, w, h)
