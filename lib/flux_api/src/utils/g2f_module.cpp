#include <algorithm>
#include "stdio.h"
#include "stdlib.h"
#include "string.h"
#include "ctype.h"
#include "float.h"
#include "math.h"
#include "g2f_module.h"

float FLT_SAFE = -(FLT_MAX/10);
#define quick_abs(x) (x>0?x:-x)

float MAX_HEIGHT = 230;


float atof_with_char_ptr(char *s, char** sptr) {
  bool neg = false;
  float a = 0.0;
  int e = 0;
  int c;
  if (*s == '-') {
    neg = true;
    s++;
  }
  while ((c = *s++) != '\0' && isdigit(c)) {
    a = a*10.0 + (c - '0');
  }
  if (c == '.') {
    while ((c = *s++) != '\0' && isdigit(c)) {
      a = a*10.0 + (c - '0');
      e = e-1;
    }
  }
  
  while (e > 0) {
    a *= 10.0;
    e--;
  }
  while (e < 0) {
    a *= 0.1;
    e++;
  }

  *sptr = s - 1;
  return neg ? -a : a;
}

char* substr(const char* str, int start) {
  int len = strlen(str);
  char* newstr = (char*)malloc(len - start + 1); 
  strncpy(newstr, &str[start], len-start);
  newstr[len - start] = '\0';
  return newstr;
}

void write_char(char** dest, char n) {
  strncpy(*dest, (char*)&n, 1);
  *dest += 1;
}

void write_float(char** dest, float n) {
  union {
    float a;
    char bytes[4];
  } converter;
  converter.a = n;
  (*dest)[0] = converter.bytes[0];
  (*dest)[1] = converter.bytes[1];
  (*dest)[2] = converter.bytes[2];
  (*dest)[3] = converter.bytes[3];
  *dest += 4;
}

struct token_result{
  char ch;
  float f;
  char valid;
};

typedef struct token_result TokenResult;

TokenResult find_next_token(char** ptr) {
  TokenResult result;
  result.ch = '?';
  result.valid = 0;
  
  while(true) {
    switch(**ptr) {
      case 0:
        return result;
      case ' ':
        (*ptr)++;
        continue;
      case 'G':
      case 'M':
      case 'X':
      case 'Y':
      case 'Z':
      case 'E':
      case 'F':
      case 'T':
      case 'S':
      case 'P':
        result.ch = **ptr;
        result.f = atof_with_char_ptr((*ptr)+1, ptr);
        result.valid = 1;
        //printf("Found Char %c, Num %lf\n", tkr.ch, tkr.f);
        return result;
      default:
        return result;
    }
  }
  return result;
}


void fillZero(float* nums, int length) {
  for (int i = 0; i < length; i++)
    nums[i] = 0.0;
}

FILE* c_open_file(char* path) {
  return fopen(path, "r");
}

FCode* createFCodePtr() {
  FCode* fc = (FCode*)malloc(sizeof(FCode));

  fc->tool = 0;
  fc->absolute = 1;
  fc->extrude_absolute = 1;
  fc->unit = 1;

  fc->current_speed = 1;
  fillZero(fc->G92_delta,7);

  fc->time_need = 0;
  fc->distance = 0;

  fillZero(fc->max_range,4);
  fillZero(fc->filament,3);
  fillZero(fc->current_pos,7);

  fc->HEAD_TYPE = NULL;

  fc->is_cura = 1;

  fc->record_path = 1;
  fc->layer_now = 0;

  fc->native_path = new vector< vector<PathVector> >();
  fc->pause_at_layers = new vector<int>();

  PathVector p = {0, 0, MAX_HEIGHT, TYPE_MOVE};
  vector<PathVector> first_layer;
  first_layer.push_back(p);

  fc->native_path->push_back(first_layer);

  fc->counter_between_layers = 0;
  fc->record_z = 0;
  fc->is_backed_to_normal_temperature = 0;

  fc->path_type = TYPE_MOVE;
  return fc;
}

int XYZEF(char* str, FCode* fc, float *num) {
    // """
    // Parses data into a list: [F, X, Y, Z, E1, E2, E3]
    // and forms the proper command
    // element will be None if not provided
    // input_list : ['G1', 'F200', 'X1.0', 'Y-2.0']
    // """
    int command = 0;

    while(true) {
      TokenResult token = find_next_token(&str);
      if (!token.valid) break;
      switch(token.ch) {
        case 'F':
          command |= (1 << 6);
          num[0] = token.f;
          break;
        case 'X':
          command |= (1 << 5);
          num[1] = token.f * fc->unit;
          break;
        case 'Y':
          command |= (1 << 4);
          num[2] = token.f * fc->unit;
          break;
        case 'Z':
          command |= (1 << 3);
          num[3] = token.f * fc->unit;
          break;
        case 'E':
          command |= (1 << (2 - fc->tool));
          num[4 + fc->tool] = token.f * fc->unit;
          break;
        default:
          //TODO LOG FAIL
          break;
      }
    }
    return command;
}



void process_path(FCode* fc, char* comment, bool move_flag, bool extrude_flag) {
  // """
  // convert to path list(for visualizing)
  // """
  if (fc->is_cura || comment == NULL) {
    // Cura
    fc->counter_between_layers++;
    PathType line_type = TYPE_MOVE;
    if (fc->path_type == TYPE_NEWLAYER) {
        fc->path_type = TYPE_MOVE;
        fc->record_z = fc->current_pos[3];
        fc->counter_between_layers = 0;
        fc->layer_now = fc->native_path->size();

        vector<PathVector> new_layer;
        PathVector p = fc->native_path->back().back();
        p.path_type = fc->path_type;
        new_layer.push_back(p);
        fc->native_path->push_back(new_layer);
    }
    if (move_flag) {
        if (extrude_flag) {
            if (fc->path_type != TYPE_MOVE) {
              line_type = fc->path_type;
            } else {
              line_type = TYPE_PERIMETER;
            }
        } else {
          line_type = TYPE_MOVE;
        }      
        if (line_type == TYPE_PERIMETER && fc->highlight_layer == fc->layer_now) { 
          line_type = TYPE_HIGHLIGHT;
        }
        PathVector p = {fc->current_pos[1], fc->current_pos[2], fc->current_pos[3], line_type};
        fc->native_path->back().push_back(p);
    }
  } else {
    bool splitted = false;
    fc->counter_between_layers++;
    PathType line_type = TYPE_MOVE;

    if (move_flag) {
        if (strstr(comment, "infill")) {
            line_type = TYPE_INFILL;
        } else if(strstr(comment, "support")) {
            line_type = TYPE_SUPPORT;
        } else if(strstr(comment,"brim")) {
            line_type = TYPE_SUPPORT;
        } else if(strstr(comment,"move")) {
            line_type = TYPE_MOVE;
            if(strstr(comment,"to next layer")){
                fc->record_z = fc->current_pos[3];
                splitted = true;

                fc->counter_between_layers = 0;
                fc->layer_now = fc->native_path->size();

                vector<PathVector> new_layer;
                PathVector p = fc->native_path->back().back();
                p.path_type = fc->path_type;
                new_layer.push_back(p);
                fc->native_path->push_back(new_layer);
            }
        } else if(strstr(comment,"perimeter")) {
            line_type = TYPE_PERIMETER;
        } else if(strstr(comment,"skirt")) {
            line_type = TYPE_SKIRT;
        } else if(strstr(comment,"draw")) {
            line_type = TYPE_INFILL;
        }else {
            line_type = extrude_flag ? TYPE_PERIMETER : TYPE_MOVE;
        }
        
        if (line_type == TYPE_PERIMETER && fc->highlight_layer == fc->layer_now) { 
          line_type = TYPE_HIGHLIGHT;
        }
        PathVector p = {fc->current_pos[1], fc->current_pos[2], fc->current_pos[3], line_type};
        fc->native_path->back().push_back(p);
        
        if (strlen(comment) == 0 && !splitted && fc->current_pos[3] - fc->record_z > 0.3) {
          // 0.3 is the max layer height in fluxstudio
          vector<PathVector> new_layer;
          PathVector p = fc->native_path->back().back();
          p.path_type = fc->path_type;
          new_layer.push_back(p);
          fc->native_path->push_back(new_layer);

          fc->record_z = fc->current_pos[3];
          fc->counter_between_layers = 0;
          fc->layer_now = fc->native_path->size();
      }
    }
  }
}

void analyze_metadata(float* data, char* comment, FCode* fc) {
  //  """
  // input_list: [F, X, Y, Z, E1, E2, E3]
  // compute filament need for each extruder
  // compute time needed
  // """
  if (data[0]!= FLT_SAFE) fc->current_speed = data[0];

  float tmp_path = 0;
  bool move_flag = 0;  //record if position change in this command
  for (int i = 1; i < 4; i++) {
    if (data[i]!= FLT_SAFE) {
      move_flag = 1;
      if (fc->absolute) {
        tmp_path += (data[i] - fc->current_pos[i]) * (data[i] - fc->current_pos[i]);
        fc->current_pos[i] = data[i];
      } else {
        tmp_path += data[i] * data[i];
        fc->current_pos[i] += data[i];
      }
      if (quick_abs(fc->current_pos[i]) > fc->max_range[i - 1]) {
        fc->max_range[i - 1] = quick_abs(fc->current_pos[i]);
      }
    }
  }

  tmp_path = sqrt(tmp_path);

  //Find largest R
  float pos_r = (fc->current_pos[1] * fc->current_pos[1]) + (fc->current_pos[2] * fc->current_pos[2]);
  if (pos_r > fc->max_range[3]) { //compute sqrt later, save power first
    fc->max_range[3] = pos_r;
  }

  bool extrude_flag = 0;

  for (int i = 4; i < 7; i++) {
    if (data[i]!= FLT_SAFE) {
      extrude_flag = 1;
      if (fc->absolute) {
        fc->filament[i-4] += data[i] - fc->current_pos[i];
        fc->current_pos[i] = data[i];
      } else {
        fc->filament[i-4] += data[i];
        fc->current_pos[i] += data[i];
      }
    }
  }
  fc->distance += tmp_path;
  fc->time_need += tmp_path * 60 / (fc->current_speed);
  
  if (fc->record_path) {
    process_path(fc, comment, move_flag, extrude_flag);
  }
}

const char* symbols[7] = {"F","X","Y","Z","E1","E2","E3"};

int convert_to_fcode_by_line(char* line, FCode* fc, char* fcode_output) {
  // printf("Tool %d\n", fc->tool);
  char* output_ptr = fcode_output;

  char* comment_ptr = strchr(line, ';');
  char* comment = NULL;
  //TODO: Fix comment list
  //Parse comments
  if (line[0] == ':') {
    comment = substr(line, 1);
    //comment_list.push(comment);
    strcpy(line, "000");
  } else if (comment_ptr!=NULL) {
    comment = substr(comment_ptr+1, 0);
    //comment_list.push(comment);
  }

  if (strlen(line) == 0) return 0;

  char* cmd = line;

  TokenResult parsed_command = find_next_token(&cmd);

  //Command parse
  char cmd_type = parsed_command.ch;
  int cmd_no = parsed_command.f;

  //printf("index: %d, cmd_type: %c, cmd_no: %d\n", fc->index, cmd_type, cmd_no);

  float data[7] = {FLT_SAFE,FLT_SAFE,FLT_SAFE,FLT_SAFE,FLT_SAFE,FLT_SAFE,FLT_SAFE};
  int subcommand = 0;
  int command_code = 0;
  float temperature = 0;
  char* data_output;
  TokenResult token;

  if (cmd_type == 'G') {
    switch(cmd_no) {
      case 0:
      case 1:
        subcommand = XYZEF(cmd, fc, data);
        //data: [F, X, Y, Z, E1, E2, E3]

        // TODO fix g92 offset ? to be tested
        if (fc->absolute) {
          for (int i = 0; i < 7; i++) {
            if (data[i]!=FLT_SAFE) {
              data[i] += fc->G92_delta[i];
            }
          }
        }

        // Auto pause at layers
        if (std::find(fc->pause_at_layers->begin(), fc->pause_at_layers->end(), fc->layer_now) != fc->pause_at_layers->end()) {
            if (fc->highlight_layer != fc->layer_now) {
                fprintf(stderr, "[G2FCPP-EXT] Auto pause at %d\n", fc->layer_now);
                fc->highlight_layer = fc->layer_now;
                
                write_char(&output_ptr, 5);
            }
        }
        
        // Overwrite following layer temperature
        if (fc->layer_now == 2 && fc->printing_temperature > 50 && !fc->is_backed_to_normal_temperature){
            write_char(&output_ptr, 16);
            write_float(&output_ptr, fc->printing_temperature);
            fprintf(stderr, "[G2FCPP-EXT] Setting toolhead temperature back to normal # %d to %f\n", fc->layer_now, fc->printing_temperature);
            fc->is_backed_to_normal_temperature = true;
        }

        analyze_metadata(data, comment, fc);

        command_code = subcommand | 128;
        write_char(&output_ptr, command_code);
        for (int i = 0; i < 7; i++) {
          if (data[i]!=FLT_SAFE) {
            write_float(&output_ptr, data[i]);
          }
        }
        break;
      case 2: //Arc
      case 3: //Arc
        break;
      case 4: //Pause for a while
        write_char(&output_ptr, 4);
        token = find_next_token(&cmd);
        if (token.valid) {
          float ms = (token.ch == 'S') ? token.f * 1000 : token.f;
          token = find_next_token(&cmd);
          if (ms < 0) {
            ms = 0;
          }
          write_float(&output_ptr, ms); 
          fc->time_need += ms / 1000;
        }
        break;
      case 20: //units = inch
        fc->unit = 25.4;
        break;
      case 21: //units = mm
        fc->unit = 1;
        break;
      case 28: //Home
        write_char(&output_ptr, 1);
        fc->current_pos[1] = fc->current_pos[2] = 0;
        fc->current_pos[3] = MAX_HEIGHT;
        break;
      case 90: //Absolute
        fc->absolute = true;
        write_char(&output_ptr, 2);
        break;
      case 91: //Relative
        fc->absolute = false;
        write_char(&output_ptr, 3);
        break;
      case 92: //Set Position
        subcommand = XYZEF(cmd, fc, data);
        if (subcommand == 0) {
          for (int i = 0; i < 7; i++) {
            fc->G92_delta[i] = 0.0;
          }
        } else {
          for (int i = 0; i < 7; i++) {
            if (data[i]!=FLT_SAFE) {
              fc->G92_delta[i] = fc->current_pos[i] - data[i];
            }
          }
        }
        break;
    }
  } else if (cmd_type == 'M') {
    switch(cmd_no) {
      case 25: // Pause
      case 0: //Pause
        write_char(&output_ptr, 5);
        break;
      case 82: //Absolute Extrude
        fc->extrude_absolute = true;
        break;
      case 83: //Relative Extrude
        fc->extrude_absolute = false;
        break;
      case 104: //Temp
      case 109: //Temp
        command_code = 16;
        if (cmd_no == 109) command_code |= (1 << 3);
        while(true) {
          token = find_next_token(&cmd);
          if (!token.valid) break;
          if (token.ch == 'S') {
            temperature = token.f;
          } else if (token.ch == 'T') {
            fc->tool = (int)token.f;
          }
        }

        if (fc->tool > 7 || fc->tool <0) {
          //Too many extruder!
          break;
        }
        
        command_code |= fc->tool;
        write_char(&output_ptr, command_code); 
        write_float(&output_ptr, temperature); 
        break;
      case 106: //Fan
      case 107: //Fan
        write_char(&output_ptr, 48 | 0); // TODO: change this part, consder muti-fan control protocol
        if (cmd_no == 107) {
          write_float(&output_ptr, 0.0);
        } else if (cmd_no == 106) {
            token = find_next_token(&cmd);
            if (token.valid) {
              write_float(&output_ptr, token.f / 255.0);
            } else {
              write_float(&output_ptr, 1.0);
            }
        }
        break;
      case 84: //Loose motor ( ndef )
      case 140: //Loose motor ( ndef)
        break;
    }

  } else if (cmd_type == 'X') {
    switch(cmd_no) {
      case 2:
        write_char(&output_ptr, 32);
        token = find_next_token(&cmd);
        float strength = (token.ch == 'O') ? token.f/255 : 0;
        write_float(&output_ptr, strength);
        fc->HEAD_TYPE = "LASER";
        break;
    }
  } else if (cmd_type == 'T') {
    switch(cmd_no) {
      case 0:
        fc->tool = 0;
        break;
      case 1:
        fc->tool = 1;
        break;
    }
  } else if (comment!=NULL) {
    char* cura_comment = comment;
    if (strlen(cura_comment)>6) cura_comment = cura_comment + 6; 
    if (strstr(comment, "FILL") != NULL) {
        fc->path_type = TYPE_INFILL;
    } else if (strstr(comment, "SUPPORT") != NULL) {
        fc->path_type = TYPE_SUPPORT;
    } else if (strstr(comment, "LAYER") != NULL) {
        fc->path_type = TYPE_NEWLAYER;
    } else if (strstr(comment, "WALL-OUTER") != NULL) {
        fc->path_type = TYPE_PERIMETER;
    } else if (strstr(comment, "WALL-INNER") != NULL) {
        fc->path_type = TYPE_INNERWALL;
    } else if (strstr(comment, "RAFT") != NULL) {
        fc->path_type = TYPE_RAFT;
    } else if (strstr(comment, "SKIRT") != NULL) {
        fc->path_type = TYPE_SKIRT;
    } else if (strstr(comment, "SKIN") != NULL) {
        fc->path_type = TYPE_SKIN;
    } 
  }

  // fprintf(stdout, "command parsed %d\n", (int)(output_ptr - fcode_output));
  return (int)(output_ptr - fcode_output);
}

// PathVector createPathPoint(float x, float y, float z, PathType t) {

// }