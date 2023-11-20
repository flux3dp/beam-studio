
#include<stdexcept>
#include "py_processor.h"


FLUX::PythonToolpathProcessor::PythonToolpathProcessor(PyObject *python_callback) {
    callback = python_callback;
}


void FLUX::PythonToolpathProcessor::moveto(int flags, float feedrate, float x, float y, float z, float s) {
    PyObject *arglist = Py_BuildValue("(s)", "moveto");
    PyObject *dictlist = Py_BuildValue("{s:i,s:f,s:f,s:f,s:f,s:f}",
                                       "flags", flags, "feedrate", feedrate,
                                       "x", x, "y", y, "z", z, "s", s);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::sleep(float milliseconds) {
    PyObject *arglist = Py_BuildValue("(s)", "sleep");
    PyObject *dictlist = Py_BuildValue("{s:f}", "milliseconds", milliseconds);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::enable_motor(void) {
    PyObject *arglist = Py_BuildValue("(s)", "enable_motor");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::disable_motor(void) {
    PyObject *arglist = Py_BuildValue("(s)", "disable_motor");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::pause(bool to_standby_position) {
    PyObject *arglist = Py_BuildValue("(s)", "pause");
    PyObject *dictlist = Py_BuildValue("{s:b}", "to_standby_position", to_standby_position);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::home(void) {
    PyObject *arglist = Py_BuildValue("(s)", "home");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_toolhead_heater_temperature(float temperature, bool wait) {
    PyObject *arglist = Py_BuildValue("(s)", "set_toolhead_heater_temperature");
    PyObject *dictlist = Py_BuildValue("{s:f,s:b}", "temperature", temperature, "wait", wait);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_toolhead_fan_speed(float strength) {
    PyObject *arglist = Py_BuildValue("(s)", "set_toolhead_fan_speed");
    PyObject *dictlist = Py_BuildValue("{s:f}", "strength", strength);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_toolhead_pwm(float strength) {
    PyObject *arglist = Py_BuildValue("(s)", "set_toolhead_pwm");
    PyObject *dictlist = Py_BuildValue("{s:f}", "strength", strength);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::dwell_cmd(uint32_t milli_second) {
    PyObject *arglist = Py_BuildValue("(s)", "dwell_cmd");
    PyObject *dictlist = Py_BuildValue("{s:i}", "milli_second", milli_second);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_toolhead_laser_module(uint32_t laser_type) {
    PyObject *arglist = Py_BuildValue("(s)", "set_toolhead_laser_module");
    PyObject *dictlist = Py_BuildValue("{s:i}", "laser_type", laser_type);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_calibrate(void) {
    PyObject *arglist = Py_BuildValue("(s)", "set_calibrate");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::turn_on_gradient_print_mode(char resolution) {
    PyObject *arglist = Py_BuildValue("(s)", "turn_on_gradient_print_mode");
    PyObject *dictlist = Py_BuildValue("{s:c}", "resolution", resolution);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::turn_off_gradient_print_mode(void) {
}

void FLUX::PythonToolpathProcessor::set_line_pixels(uint32_t pixel_number) {
    PyObject *arglist = Py_BuildValue("(s)", "set_line_pixels");
    PyObject *dictlist = Py_BuildValue("{s:i}", "pixel_number", pixel_number);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::fill_32_pixels(uint32_t pixels) {
    PyObject *arglist = Py_BuildValue("(s)", "fill_32_pixels");
    PyObject *dictlist = Py_BuildValue("{s:i}", "pixels", pixels);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_time_est_acc_x(uint32_t acc) {
    PyObject *arglist = Py_BuildValue("(s)", "set_time_est_acc_x");
    PyObject *dictlist = Py_BuildValue("{s:i}", "acc", acc);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_fill_end(void) {
    PyObject *arglist = Py_BuildValue("(s)", "set_fill_end");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_print_line_status(void) {
    PyObject *arglist = Py_BuildValue("(s)", "set_print_line_status");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::enter_printer_mode(void) {
    PyObject *arglist = Py_BuildValue("(s)", "enter_printer_mode");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::wait_printer_mode_sync(void) {
    PyObject *arglist = Py_BuildValue("(s)", "wait_printer_mode_sync");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::exit_printer_mode(void) {
    PyObject *arglist = Py_BuildValue("(s)", "exit_printer_mode");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::start_printer_packet(uint8_t packet_type) {
    PyObject *arglist = Py_BuildValue("(s)", "start_printer_packet");
    PyObject *dictlist = Py_BuildValue("{s:i}", "packet_type", packet_type);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::end_printer_packet(void) {
    PyObject *arglist = Py_BuildValue("(s)", "end_printer_packet");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_printer_packet_px_count(uint32_t count) {
    PyObject *arglist = Py_BuildValue("(s)", "set_printer_packet_px_count");
    PyObject *dictlist = Py_BuildValue("{s:i}", "count", count);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_printer_packet_length(uint32_t length) {
    PyObject *arglist = Py_BuildValue("(s)", "set_printer_packet_length");
    PyObject *dictlist = Py_BuildValue("{s:i}", "length", length);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::start_printer_packet_payload(void) {
    PyObject *arglist = Py_BuildValue("(s)", "start_printer_packet_payload");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::add_printer_packet_payload(uint8_t byte) {
    PyObject *arglist = Py_BuildValue("(s)", "add_printer_packet_payload");
    PyObject *dictlist = Py_BuildValue("{s:i}", "byte", byte);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::set_printer_packet_crc(uint16_t val) {
    PyObject *arglist = Py_BuildValue("(s)", "set_printer_packet_crc");
    PyObject *dictlist = Py_BuildValue("{s:i}", "val", val);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::sync_grbl_motion(uint32_t val) {
    PyObject *arglist = Py_BuildValue("(s)", "sync_grbl_motion");
    PyObject *dictlist = Py_BuildValue("{s:i}", "val", val);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::flux_custom_cmd(uint32_t val) {
    PyObject *arglist = Py_BuildValue("(s)", "flux_custom_cmd");
    PyObject *dictlist = Py_BuildValue("{s:i}", "val", val);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::one_seg_custom_cmd(int type, uint8_t cmd) {
    PyObject *arglist = Py_BuildValue("(s)", "one_seg_custom_cmd");
    PyObject *dictlist = Py_BuildValue("{s:i,s:i}", "type", type, "cmd", cmd);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::end_content(void) {
    PyObject *arglist = Py_BuildValue("(s)", "end_content");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::write_post_config(const char* s, size_t length) {
    PyObject *arglist = Py_BuildValue("(s)", "write_post_config");
    PyObject *dictlist = Py_BuildValue("{s:s#}", "s", s, length);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::append_anchor(uint32_t value) {
    PyObject *arglist = Py_BuildValue("(s)", "append_anchor");
    PyObject *dictlist = Py_BuildValue("{s:i}", "value", value);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::write_string(const char* s, size_t length, bool write_length) {
    PyObject *arglist = Py_BuildValue("(s)", "write_string");
    PyObject *dictlist = Py_BuildValue("{s:s#,:b}", "s", s, length, "write_length", write_length);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::start_task_script_block(const char* header, const char* proc_id) {
    PyObject *arglist = Py_BuildValue("(s)", "start_task_script_block");
    PyObject *dictlist = Py_BuildValue("{s:s#,s:s#}", "header", header, 4, "proc_id", proc_id, 4);
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::end_task_script_block(void) {
    PyObject *arglist = Py_BuildValue("(s)", "end_task_script_block");
    PyObject_CallObject(callback, arglist);
    Py_DECREF(arglist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::append_comment(const char* message, size_t length) {
    PyObject *arglist = Py_BuildValue("(s)", "append_comment");
    PyObject *dictlist = Py_BuildValue("{s:s#}", "message", message, length);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::on_error(bool critical, const char* message, size_t length) {
    PyObject *arglist = Py_BuildValue("(s)", "on_error");
    PyObject *dictlist = Py_BuildValue("{s:b,s:s#}",
                                       "critical", critical,
                                       "message", message, length);
    PyObject_Call(callback, arglist, dictlist);
    Py_DECREF(arglist);
    Py_DECREF(dictlist);
    if(PyErr_Occurred()) {
        throw std::runtime_error("PYERROR");
    }
}

void FLUX::PythonToolpathProcessor::terminated(void) {

}
