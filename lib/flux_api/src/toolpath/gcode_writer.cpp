
#include <stdexcept>
#include "gcode.h"

FLUX::GCodeWriterBase::GCodeWriterBase() {
    t = 0;
}

void FLUX::GCodeWriterBase::moveto(int flags, float feedrate, float x, float y, float z, float s) {
    int size;

    write("G1", 2);
    if(flags & FLAG_HAS_FEEDRATE) {
        size = snprintf(buffer, 32, " F%.4f", feedrate);
        write(buffer, size);
    }
    if(flags & FLAG_HAS_X) {
        size = snprintf(buffer, 32, " X%.4f", x);
        write(buffer, size);
    }
    if(flags & FLAG_HAS_Y) {
        size = snprintf(buffer, 32, " Y%.4f", y);
        write(buffer, size);
    }
    if(flags & FLAG_HAS_Z) {
        size = snprintf(buffer, 32, " Z%.4f", z);
        write(buffer, size);
    }
    if(flags & FLAG_HAS_S) {
        size = snprintf(buffer, 32, " S%.4f", s);
        write(buffer, size);
    }

    write("\n", 1);
}

void FLUX::GCodeWriterBase::sleep(float seconds) {
    int size;
    if(seconds > 1 && (((int)(seconds * 1000) % 1000) < 1)) {
        size = snprintf(buffer, 32, "G4 S%i", (int)(seconds));
        write(buffer, size);
    } else if(seconds > 0) {
        size = snprintf(buffer, 32, "G4 P%i", (int)(seconds * 1000));
        write(buffer, size);
    }

    write("\n", 1);
}

void FLUX::GCodeWriterBase::enable_motor(void) {
    write("M17", 3);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::disable_motor(void) {
    write("M84", 3);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::pause(bool to_standby_position) {
    if(to_standby_position) {
        write("M25\n", 5);
    } else {
        write("M25 Z0\n", 4);
    }
}

void FLUX::GCodeWriterBase::home(void) {
    write("$H\n", 3);
}

void FLUX::GCodeWriterBase::set_toolhead_heater_temperature(float temperature, bool wait) {
    int size;
    if(wait) {
        size = snprintf(buffer, 32, "M109 S%.1f", temperature);
    } else {
        size = snprintf(buffer, 32, "M104 S%.1f", temperature);
    }
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_toolhead_fan_speed(float strength) {
    if(strength > 0) {
        int size;
        size = snprintf(buffer, 32, "M106 S%i", (int)(strength * 255));
        write(buffer, size);
        write("\n", 1);
    } else {
        write("M107\n", 5);
    }
}

void FLUX::GCodeWriterBase::set_toolhead_pwm(float strength) {
    if (strength < 0) {
        int size;
        size = snprintf(buffer, 32, "G1 U%i", (int)(strength * -1000));
        write(buffer, size);
    } else if (strength < 0.001) {
        write("G1S0", 4);
    } else {
        write("G1V0", 4);
    }
    write("\n", 1);
}

void FLUX::GCodeWriterBase::dwell_cmd(uint32_t milli_second) {
    int size;
    size = snprintf(buffer, 32, "F4 %i", (int)(milli_second));
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_toolhead_laser_module(uint32_t laser_type) {
    int size;
    size = snprintf(buffer, 32, "F7 %i", (int)(laser_type));
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_calibrate(void) {
    int size;
    size = snprintf(buffer, 32, "B8 1");
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::turn_on_gradient_print_mode(char resolution) {
    int size;
    size = snprintf(buffer, 32, "F16 1 %c", resolution);
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::turn_off_gradient_print_mode(void) {
    int size;
    size = snprintf(buffer, 32, "F16 6");
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_line_pixels(uint32_t pixel_number) {
    int size;
    size = snprintf(buffer, 32, "F16 2 %i", pixel_number);
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::fill_32_pixels(uint32_t pixels) {
    int size;
    size = snprintf(buffer, 32, "F16 3 %i", pixels);
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_time_est_acc_x(uint32_t acc) {
}

void FLUX::GCodeWriterBase::set_fill_end(void) {
    int size;
    size = snprintf(buffer, 32, "F16 4");
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::set_print_line_status(void) {
    int size;
    size = snprintf(buffer, 32, "F16 5");
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::enter_printer_mode(void) {
    int size;
    size = snprintf(buffer, 32, "F18 0 1\n");
    write(buffer, size);
}

void FLUX::GCodeWriterBase::wait_printer_mode_sync(void) {
    int size;
    size = snprintf(buffer, 32, "F18 0 0\n");
    write(buffer, size);
}

void FLUX::GCodeWriterBase::exit_printer_mode(void) {
    int size;
    size = snprintf(buffer, 32, "F18 0 2\n");
    write(buffer, size);
}

void FLUX::GCodeWriterBase::start_printer_packet(uint8_t packet_type) {
    int size = snprintf(buffer, 32, "F17 3  %i\n", packet_type);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::end_printer_packet(void) {
    int size = snprintf(buffer, 32, "F17 4\n");
    write(buffer, size);
}

void FLUX::GCodeWriterBase::set_printer_packet_px_count(uint32_t count) {
    int size;
    size = snprintf(buffer, 32, "F17 5 %i\n", count);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::set_printer_packet_length(uint32_t length) {
    int size;
    size = snprintf(buffer, 32, "F17 0 %i\n", length);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::start_printer_packet_payload(void) {
    int size;
    size = snprintf(buffer, 32, "F17 1\n");
    write(buffer, size);
}

void FLUX::GCodeWriterBase::add_printer_packet_payload(uint8_t byte) {
    int size;
    size = snprintf(buffer, 32, "%i\n", byte);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::set_printer_packet_crc(uint16_t val) {
    int size;
    size = snprintf(buffer, 32, "F17 2 %i\n", val);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::sync_grbl_motion(uint32_t val) {
    int size;
    size = snprintf(buffer, 32, "M137P%i\n", val);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::flux_custom_cmd(uint32_t val) {
    int size;
    size = snprintf(buffer, 32, "M136P%i\n", val);
    write(buffer, size);
}

void FLUX::GCodeWriterBase::one_seg_custom_cmd(int type, uint8_t cmd) {}

void FLUX::GCodeWriterBase::append_anchor(uint32_t value) {
    int size;
    size = snprintf(buffer, 32, ";anchor=%i\n", value);
    write(buffer, size);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::write_string(const char* s, size_t length, bool write_length) {}
void FLUX::GCodeWriterBase::start_task_script_block(const char* header, const char* proc_id) {}
void FLUX::GCodeWriterBase::end_task_script_block(void) {}
void FLUX::GCodeWriterBase::end_content(void) {}
void FLUX::GCodeWriterBase::write_post_config(const char* s, size_t length) {}

void FLUX::GCodeWriterBase::append_comment(const char* message, size_t length) {
    write(";", 1);
    write(message, length);
    write("\n", 1);
}

void FLUX::GCodeWriterBase::on_error(bool critical, const char* message, size_t length) {
    if(critical) {
        write("\n; >>>>>>>>>> ERROR: ", 21);
    } else {
        write("\n; >>>>>>>>>> WARNING: ", 23);
    }
    write(message, length);
    write("\n", 1);
}


// GCodeMemoryWriter
FLUX::GCodeMemoryWriter::GCodeMemoryWriter(void) {
    stream = new std::stringstream();
    opened = true;
}


FLUX::GCodeMemoryWriter::~GCodeMemoryWriter(void) {
    delete stream;
}


void FLUX::GCodeMemoryWriter::write(const char* buf, size_t size) {
    if(opened) {
        stream->write(buf, size);
    }
}


void FLUX::GCodeMemoryWriter::terminated(void) {
    opened = false;
}


std::string FLUX::GCodeMemoryWriter::get_buffer(void) {
    return stream->str();
}

// GCodeFileWriter
FLUX::GCodeFileWriter::GCodeFileWriter(const char* filename) {
    stream = new std::ofstream(filename);
    if(stream->fail()) {
        throw std::runtime_error("OPEN FILE ERROR");
    }
}


FLUX::GCodeFileWriter::~GCodeFileWriter(void) {
    if(stream->is_open()) {
        terminated();
    }
    delete stream;
}

void FLUX::GCodeFileWriter::write(const char* buf, size_t size) {
    if(stream->is_open()) {
        stream->write(buf, size);
    }
}


void FLUX::GCodeFileWriter::terminated(void) {
    if(stream->is_open()) stream->close();
}
