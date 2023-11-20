
#include <stdlib.h>
#include <stdint.h>
#include <stdarg.h>
#include "gcode.h"


static inline bool move_to_next_char(const char* linep, int offset, int size, int* next_offset) {
    while(offset < size) {
        if(linep[offset] != ' ') {
            *next_offset = offset;
            return true;
        }
        offset++;
    }
    *next_offset = offset;
    return false;
}


static inline int parse_command_int(const char* linep, int offset, int size, int* val) {
    char* endptr;
    if(offset + 1 >= size) {
        *val = 0;
        return size;
    }
    *val = (int)strtol(linep + offset + 1, &endptr, 10);
    return endptr - linep;
}


static inline int parse_command_float(const char* linep, int offset, int size, float* val) {
    char* endptr;
    if(offset + 1 == size) {
        *val = 0;
        return size;
    }
    *val = strtof(linep + offset + 1, &endptr);
    return endptr - linep;

}


static inline void on_error(FLUX::ToolpathProcessor *handler, bool critical, const char* fmt, ...) {
    va_list argptr;
    va_start(argptr, fmt);
    char* buf = (char*)malloc(1024);
    int size = vsnprintf(buf, 1024, fmt, argptr);
    handler->on_error(critical, buf, size);
}


FLUX::GCodeParser::GCodeParser(void) {
    position[0] = position[1] = position[2] = 0;
    filaments[0] = filaments[1] = filaments[2] = 0;
    position_offset[0] = position_offset[1] = position_offset[2] = 0;
    filaments_offset[0] = filaments_offset[1] = filaments_offset[2] = 0;
    from_inch = false;
    absolute = true;
    T = 0;
}


void FLUX::GCodeParser::set_processor(FLUX::ToolpathProcessor* _handler) {
    handler = _handler;
}


void FLUX::GCodeParser::parse_from_file(const char* filepth) {
    std::ifstream infile(filepth);
    std::string linep;

    while (std::getline(infile, linep)) {
        parse_command(linep.c_str(), linep.size());
    }
}


void FLUX::GCodeParser::parse_command(const char* linep, size_t size) {
    int cmd_offset = 0;
    if(!move_to_next_char(linep, 0, size, &cmd_offset)) { return; }

    char cmdprefix = linep[cmd_offset];
    int cmdid;
    cmd_offset = parse_command_int(linep, cmd_offset, size, &cmdid);

    switch(cmdprefix) {
        case 'G':
            switch(cmdid) {
                case 0:
                case 1:
                    cmd_offset = handle_g0g1(linep, cmd_offset, size);
                    break;
                case 4:
                    cmd_offset = handle_g4(linep, cmd_offset, size);
                    break;
                case 20:
                    from_inch = true;
                    break;
                case 21:
                    from_inch = false;
                    break;
                case 28:
                    cmd_offset = handle_g28(linep, cmd_offset, size);
                    break;
                case 90:
                    absolute = true;
                    break;
                case 91:
                    absolute = false;
                    break;
                case 92:
                    cmd_offset = handle_g92(linep, cmd_offset, size);
                    break;
                default:
                    on_error(handler, true, "BAD_COMMAND %.*s", size, linep);
                    break;
            }
            break;
        case 'M':
            switch(cmdid) {
                case 17:
                    cmd_offset = handle_m17(linep, cmd_offset, size);
                    break;
                case 18:
                case 84:
                    cmd_offset = handle_m18m84(linep, cmd_offset, size);
                    break;
                case 24:
                case 25:
                case 226:
                    cmd_offset = handle_m24m25m226(linep, cmd_offset, size);
                    break;
                case 104:
                    cmd_offset = handle_m104m109(linep, cmd_offset, size, false);
                    break;
                case 107:
                    cmd_offset = handle_m107(linep, cmd_offset, size);
                    break;
                case 109:
                    cmd_offset = handle_m104m109(linep, cmd_offset, size, true);
                    break;
                case 106:
                    cmd_offset = handle_m106(linep, cmd_offset, size);
                    break;
                default:
                    on_error(handler, true, "BAD_COMMAND %.*s", size, linep);
                    break;
            }
            break;
        case 'T':
            if(cmdid >= 0 && cmdid <= 3) {
                T = cmdid;
            } else {
                on_error(handler, true, "BAD_COMMAND %.*s", size, linep);
            }
            break;
        case 'X':
            if(cmdid == 2) {
                cmd_offset = handle_x2(linep, cmd_offset, size);
            } else {
                on_error(handler, true, "BAD_COMMAND %.*s", size, linep);
            }
            break;
        case ';':
            parse_comment(linep, 0, size);
            return;
        case '\n':
            return;
        default:
            on_error(handler, true, "BAD_COMMAND %.*s", size, linep);
            break;
    }
    parse_comment(linep, cmd_offset, size);
}

void FLUX::GCodeParser::parse_comment(const char* linep, size_t offset, size_t size) {
    while(offset < size) {
        if(linep[offset++] == ';') {
            if(linep[size - 1] == '\n') {
                handler->append_comment(linep + offset, size - offset - 1);
            } else {
                handler->append_comment(linep + offset, size - offset);
            }
            return;
        }
    }
}

int FLUX::GCodeParser::handle_g0g1(const char* linep, int offset, int size) {
    bool terminated = false;
    uint8_t flags = 0;
    float val, s;

    while(offset < size && !terminated) {
        if(move_to_next_char(linep, offset, size, &offset)) {
            char param = linep[offset];
            switch(param) {
                case ';':
                case '\n':
                    terminated = true;
                    break;
                case 'F':
                    offset = parse_command_float(linep, offset, size, &val);
                    if(flags & FLAG_HAS_FEEDRATE) { on_error(handler, false, "DULE_F"); }
                    flags |= FLAG_HAS_FEEDRATE;
                    feedrate = val;
                    break;
                case 'S':
                    offset = parse_command_float(linep, offset, size, &val);
                    if(flags & FLAG_HAS_S) { on_error(handler, false, "DULE_S"); }
                    flags |= FLAG_HAS_S;
                    s = val;
                case 'X':
                case 'Y':
                case 'Z':
                    offset = parse_command_float(linep, offset, size, &val);
                    if(flags & FLAG_HAS_AXIS(param)) { on_error(handler, false, "DULE_%c", param); }
                    flags |= FLAG_HAS_AXIS(param);
                    int axis = param - 'X';
                    if(from_inch) { val = inch2mm(val); }
                    if(absolute) {
                        position[axis] = val + position_offset[axis];
                    } else {
                        position[axis] += val + position_offset[axis];
                    }
                    break;
            }
        } else {
            break;
        }
    }

    handler->moveto(flags, feedrate,
                    position[0], position[1], position[2],
                    s);
    return offset;
}


int FLUX::GCodeParser::handle_g4(const char* linep, int offset, int size) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        char cmdchar = linep[offset];
        float timelength;
        offset = parse_command_float(linep, offset, size, &timelength);

        switch(cmdchar) {
            case 'P':
                handler->sleep(timelength * 1000);
                return offset;
            case 'S':
                handler->sleep(timelength);
                return offset;
        }
    }
    on_error(handler, false, "BAD_COMMAND %.*s", size, linep);
    return offset;
}

int FLUX::GCodeParser::handle_g28(const char* linep, int offset, int size) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        on_error(handler, false, "G28_PARAM_IGNORED %.*s", size, linep);
    }
    handler->home();
    return offset;
}

int FLUX::GCodeParser::handle_g92(const char* linep, int offset, int size) {
    bool has_param_error = false;
    bool terminated = false;
    float val;
    int axis;

    while(offset < size && !terminated) {
        if(move_to_next_char(linep, offset, size, &offset)) {
            char param = linep[offset];
            offset = parse_command_float(linep, offset, size, &val);
            switch(param) {
                case ';':
                case '\n':
                    terminated = true;
                    break;
                case 'X':
                case 'Y':
                case 'Z':
                    if(from_inch) { val = inch2mm(val); }
                    axis = param - 'X';
                    position_offset[axis] = position[axis] - val;
                    break;
                case 'E':
                    if(from_inch) { val = inch2mm(val); }
                    axis = T;
                    filaments_offset[axis] = filaments[axis] - val;
                    break;
                default:
                    has_param_error = true;
            }
        } else {
            break;
        }
    }
    if(has_param_error) {
        on_error(handler, false, "BAD_PARAM %.*s", size, linep);
    }
    return offset;
}

int FLUX::GCodeParser::handle_m17(const char* linep, int offset, int size) {
    handler->enable_motor();
    return offset;
}

int FLUX::GCodeParser::handle_m18m84(const char* linep, int offset, int size) {
    handler->disable_motor();
    return offset;
}

int FLUX::GCodeParser::handle_m24m25m226(const char* linep, int offset, int size) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        char cmdchar = linep[offset];
        int val;
        offset = parse_command_int(linep, offset, size, &val);
        if(cmdchar == 'Z') {
            handler->pause(val != 0);
            return offset;
        } else {
            handler->pause(true);
            return offset;
        }
    } else {
        handler->pause(true);
        return offset;
    }
    return offset;
}

int FLUX::GCodeParser::handle_m104m109(const char* linep, int offset, int size, bool wait) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        char cmdchar = linep[offset];
        float temperature;
        offset = parse_command_float(linep, offset, size, &temperature);

        if(cmdchar == 'S') {
            handler->set_toolhead_heater_temperature(temperature, wait);
            return offset;
        }
    }
    on_error(handler, false, "BAD_COMMAND %.*s", size, linep);
    return offset;    
}

int FLUX::GCodeParser::handle_m106(const char* linep, int offset, int size) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        char cmdchar = linep[offset];
        float strength;
        offset = parse_command_float(linep, offset, size, &strength);

        if(cmdchar == 'S') {
            handler->set_toolhead_fan_speed(strength / 255.0);
            return offset;
        }
    }
    on_error(handler, false, "BAD_COMMAND %.*s", size, linep);
    return offset;    
}


int FLUX::GCodeParser::handle_m107(const char* linep, int offset, int size) {
    handler->set_toolhead_fan_speed(0);
    return offset;
}


int FLUX::GCodeParser::handle_x2(const char* linep, int offset, int size) {
    if(move_to_next_char(linep, offset, size, &offset)) {
        char cmdchar = linep[offset];
        float pwm;

        if(cmdchar == 'O') {
            offset = parse_command_float(linep, offset, size, &pwm);
            handler->set_toolhead_pwm(pwm / 255.0);
        } else if(cmdchar == 'F') {
            handler->set_toolhead_pwm(0);
        }
        return offset;
    }
    on_error(handler, false, "BAD_COMMAND %.*s", size, linep);
    return offset;    
}

