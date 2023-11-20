#include <stdio.h>
#include <math.h>
#include <stdexcept>
#include <sstream>
#include "fcode.h"
#include "crc32.c"
#include "estimate_time.cpp"

void FLUX::FCodeV2::write(std::ostream *s, const char* buf, size_t size, unsigned long *crc32_ptr) {
    s->write(buf, size);
    if(crc32_ptr) {
        *crc32_ptr = crc32(*crc32_ptr, (const void *)buf, size);
    }
}

void FLUX::FCodeV2::write(std::ostream *s, uint32_t value, unsigned long *crc32) {
    write(s, (const char *)&value, sizeof(uint32_t), crc32);
}

void FLUX::FCodeV2::write_string(const char* s, size_t length, bool write_length) {
    if(write_length) {
        write(content_stream, (uint32_t)length, &script_crc32);
    }
    write(content_stream, s, length, &script_crc32);
}

void FLUX::FCodeV2::start_task_script_block(const char* header, const char* proc_id) {
    write(content_stream, header, 4, NULL);
    if(proc_id) {
        write(content_stream, proc_id, 4, NULL);
    }
    current_task_script_start = content_stream->tellp();
    current_task_traveled = traveled;
    current_task_time_cost = time_cost;
    write(content_stream, "\x00\x00\x00\x00", 4, NULL);
}

void FLUX::FCodeV2::end_task_script_block(void) {
    int end = content_stream->tellp();
    content_stream->seekp(current_task_script_start, content_stream->beg);
    uint32_t task_length = end - current_task_script_start - 4;
    write(content_stream, task_length, NULL);
    content_stream->seekp(end, content_stream->beg);
    current_task_traveled = traveled - current_task_traveled;
    current_task_time_cost = time_cost - current_task_time_cost;
}

FLUX::FCodeV2::FCodeV2(std::vector<std::pair<std::string, std::string> > *file_metadata, std::vector<std::string> *image_previews) {
    home_x = 0; home_y = 0, home_z = 0;
    current_feedrate = 0;
    last_feedrate = 0;
    last_direction = 0;
    current_x = 0; current_y = 0; current_z = 0;
    traveled = time_cost = 0;
    max_x = max_y = max_z = 0;
    metadata = file_metadata;
    previews = image_previews;
    script_crc32 = 0;
}

void FLUX::FCodeV2::begin(void) {
    write(fc_stream, "FCx0002\n", 8, NULL);
    if(stream->tellp() < 0) {
        throw std::runtime_error("NOT_SUPPORT STREAM");
    }
}

void FLUX::FCodeV2::set_time_est_acc_x(uint32_t acc) {
    acc_x = (float)acc;
}

void FLUX::FCodeV2::moveto(int flags, float feedrate, float x, float y, float z, float s) {
    if(flags & FLAG_HAS_FEEDRATE && feedrate > 0) {
        // mm/min to mm/s
        current_feedrate = feedrate / 60;
    }

    bool has_move = false;
    float mv[3] = {0, 0, 0};

    if(flags & FLAG_HAS_X) {
        mv[0] = x - current_x;
        current_x = x;
        max_x = fmax(max_x, x);
        has_move = true;
    }
    if(flags & FLAG_HAS_Y) {
        mv[1] = y - current_y;
        current_y = y;
        max_y = fmax(max_y, y);
        has_move = true;
    }
    if(flags & FLAG_HAS_Z) {
        if (z < 0) {
            // Autofocus Homing
            current_z = 0;
        } else {
            mv[2] = z - current_z;
            current_z = z;
            max_z = fmax(max_z, z);
            has_move = true;
        }
    }

    if(has_move) {
        if (abs(mv[2]) > 0) {
            float dist = abs(mv[2]);
            traveled += dist;
            // autofocus movespeed 7.5 mm/s
            float tc = (dist / 7.5);
            if(!isnan(tc)) time_cost += tc;
        } else {
            double dist = sqrt(pow(mv[0], 2) + pow(mv[1], 2));
            if(!isnan(dist) && dist > 0) {
                traveled += dist;
                if(current_feedrate > 0) {
                    float direction = atan2(mv[1], mv[0]);
                    float last_vel = (last_feedrate * cos(direction - last_direction)); //consider direction
                    float acc = acc_x; // x-axis acc
                    if (abs(mv[1]) > 0) acc = acc_y; // y-axis acc
                    float vel = estimate_vel(last_vel, current_feedrate, acc, dist); // consider short distance
                    float tc = estimate_time(last_vel, vel, acc, dist);
                    if(!isnan(tc)) time_cost += tc;
                    last_feedrate = vel;
                    last_direction = direction;
                } else {
                    on_error(false, "BAD_FEEDRATE", 14);
                }
            }
        }
    }
    FCodeV1Base::moveto(flags, feedrate, x, y, z, s);
}

void FLUX::FCodeV2::sleep(float seconds) {
    if(!isnan(seconds)) time_cost += seconds;
    FCodeV1Base::sleep(seconds);
}
void FLUX::FCodeV2::home(void) {
    current_x = home_x; current_y = home_y; current_z = home_z;
    FCodeV1Base::home();
}

void FLUX::FCodeV2::write_json_item(std::ostream *s, std::string *key, std::string *value, unsigned long *crc32_ptr, bool is_number, bool has_next) {
    write(s, "\"", 1, crc32_ptr);
    write(s, key->c_str(), key->length(), crc32_ptr);
    write(s, "\":", 2, crc32_ptr);
    if (!is_number) write(s, "\"", 1, crc32_ptr);
    write(s, value->c_str(), value->length(), crc32_ptr);
    if (!is_number) write(s, "\"", 1, crc32_ptr);
    if (has_next) write(s, ",", 1, crc32_ptr);
}

unsigned long FLUX::FCodeV2::write_metadata(void) {
    char metabuf[128];
    int metasize;
    unsigned long metadata_crc32 = 0;

    write(fc_stream, "{", 1, &metadata_crc32);
    // write string data first
    metadata->insert(metadata->begin(),
        std::pair<std::string, std::string>("version", "2"));
    for(auto it=metadata->begin();it!=metadata->end();++it) {
        write_json_item(fc_stream, &it->first, &it->second, &metadata_crc32, false, true);
    }

    // write number data
    metasize = snprintf(metabuf, 32, "%.2f", max_z + 0.2);
    std::string key = "max_z";
    std::string data = std::string(metabuf, metasize);
    write_json_item(fc_stream, &key, &data, &metadata_crc32, true, true);
    metadata->insert(metadata->begin(), std::pair<std::string, std::string>(key, data));

    metasize = snprintf(metabuf, 32, "%.2f", max_y + 0.2);
    key = "max_y";
    data = std::string(metabuf, metasize);
    write_json_item(fc_stream, &key, &data, &metadata_crc32, true, true);
    metadata->insert(metadata->begin(), std::pair<std::string, std::string>(key, data));

    metasize = snprintf(metabuf, 32, "%.2f", max_x + 0.2);
    key = "max_x";
    data = std::string(metabuf, metasize);
    metadata->insert(metadata->begin(), std::pair<std::string, std::string>(key, data));

    metasize = snprintf(metabuf, 32, "%.2f", traveled);
    key = "travel_dist";
    data = std::string(metabuf, metasize);
    write_json_item(fc_stream, &key, &data, &metadata_crc32, true, true);
    metadata->insert(metadata->begin(), std::pair<std::string, std::string>(key, data));

    metasize = snprintf(metabuf, 32, "%.2f", time_cost);
    key = "time_cost";
    data = std::string(metabuf, metasize);
    write_json_item(fc_stream, &key, &data, &metadata_crc32, true, false);
    metadata->insert(metadata->begin(), std::pair<std::string, std::string>(key, data));

    write(fc_stream, "}", 1, &metadata_crc32);
    return metadata_crc32;
}

void FLUX::FCodeV2::end_content(void) {
    uint32_t u32value;
    // std::cout << traveled << std::endl;
    // std::cout << time_cost << std::endl;

    write(fc_stream, "FILE", 4, NULL);
    int metadata_start_pos = fc_stream->tellp();
    write(fc_stream, "\x00\x00\x00\x00", 4, NULL);
    unsigned long metadata_crc32 = write_metadata();
    int metadata_end_pos = fc_stream->tellp();
    fc_stream->seekp(metadata_start_pos, fc_stream->beg);
    u32value = metadata_end_pos - metadata_start_pos - 4;
    write(fc_stream, u32value, NULL);
    fc_stream->seekp(metadata_end_pos, fc_stream->beg);
    write(fc_stream, (uint32_t)metadata_crc32, NULL);

    write(fc_stream, "PREV", 4, NULL);
    for(auto p=previews->begin();p<previews->end();++p) {
        u32value = p->size();
        write(fc_stream, u32value, NULL);
        write(fc_stream, p->data(), u32value, NULL);
    }

    int content_end_offset = content_stream->tellp();
    u32value = content_end_offset;
    write(fc_stream, "CONT", 4, NULL);
    write(fc_stream, u32value, NULL);
    std::string content = ((std::stringstream*)content_stream)->str();
    script_crc32 = 0;
    write(fc_stream, content.c_str(), u32value, &script_crc32);
    write(fc_stream, (uint32_t)script_crc32, NULL);
}

void FLUX::FCodeV2::write_post_config(const char* s, size_t length) {
    unsigned long post_config_crc32 = 0;
    write(fc_stream, "POST", 4, NULL);
    write(fc_stream, (uint32_t)length, NULL);
    write(fc_stream, s, length, &post_config_crc32);
    write(fc_stream, (uint32_t)post_config_crc32, NULL);
}

void FLUX::FCodeV2::terminated(void) {}
FLUX::FCodeV2MemoryWriter::FCodeV2MemoryWriter(
    std::vector<std::pair<std::string, std::string> > *file_metadata,
    std::vector<std::string> *image_previews) : FCodeV2(file_metadata, image_previews
) {
    content_stream = new std::stringstream();
    stream = content_stream;
    fc_stream = new std::stringstream();
    opened = true;
    begin();
}

FLUX::FCodeV2MemoryWriter::~FCodeV2MemoryWriter(void) {
    if(opened) {
        terminated();
    }
    delete content_stream;
    delete fc_stream;
}

std::string FLUX::FCodeV2MemoryWriter::get_buffer(void) {
    return ((std::stringstream*)fc_stream)->str();
}

void FLUX::FCodeV2MemoryWriter::write(const char* buf, size_t size, unsigned long *crc32) {
    if(opened) {
        FLUX::FCodeV2::write(content_stream, buf, size, crc32);
    }
}

void FLUX::FCodeV2MemoryWriter::terminated(void) {
    if(opened) {
        FLUX::FCodeV2::terminated();
        opened = false;
    }
}
