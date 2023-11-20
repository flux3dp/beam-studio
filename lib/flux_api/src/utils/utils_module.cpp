#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <list>
#include <numeric>

#include "utils_module.h"

std::string path_to_js(std::vector< std::vector< std::vector<float> > > path){
  char buf[50];
  std::string c_string("[");
  for (size_t layer = 0; layer < path.size(); layer += 1){
    c_string += "[";
      for (size_t point = 0; point < path[layer].size(); point += 1){
        // sprintf(buf, "[%g,%g,%g,%d]", path[layer][point][0], path[layer][point][1], path[layer][point][2], (int)path[layer][point][3]);
        sprintf(buf, "[%.2f,%.2f,%.2f,%d]", path[layer][point][0], path[layer][point][1], path[layer][point][2], (int)path[layer][point][3]);
        c_string += buf;
        c_string += ",";
      }
      c_string.erase(c_string.end() - 1);
    c_string += "],";
  }
  c_string.erase(c_string.end() - 1);
  c_string += "]";
  return c_string;
}

class StringBuilder{
  list<string> m_data;
  int m_total_length;
public:
  StringBuilder(){
    m_total_length = 0;
  }
  void append(string str){
    m_data.push_back(str);
    m_total_length += str.length();
  }
  int length(){
    return m_total_length;
  }
  string toString(){
    string output = "";
    output.reserve(m_total_length);
    for (list<string>::iterator i = m_data.begin(); i != m_data.end(); ++i)
    {
      output+= *i;
    }
    return output;
  }
};

std::string path_to_js_cpp(vector< vector< PathVector > >* path){
  
  char buf[50];
  // std::string sb("[");
  StringBuilder builder;
  builder.append("[");
  // int m_reserve = 1024;
  // sb.reserve(m_reserve);
  for (size_t layer = 0; layer < path->size(); layer += 1){
    //sb+= "[";
    builder.append("[");
    int layer_size = (*path)[layer].size();
    // m_reserve += layer_size*50;
    // sb.reserve(m_reserve);
    for (int i = 0; i < layer_size; i++){
      sprintf(buf, "[%.2f,%.2f,%.2f,%d]",(*path)[layer][i].x,(*path)[layer][i].y,(*path)[layer][i].z,(*path)[layer][i].path_type - 1);
      builder.append(string(buf));
      if(i != layer_size-1) builder.append(",");
    }
    builder.append("]");
    if(layer != path->size()-1){
      builder.append(",");
    }
  }
  builder.append("]");
  // fprintf(stderr, "path_to_js_cpp end, size = %d\n", builder.length());
  return builder.toString();
}
