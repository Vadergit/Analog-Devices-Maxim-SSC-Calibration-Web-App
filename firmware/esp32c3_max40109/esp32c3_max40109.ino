#include <Arduino.h>
#include <Wire.h>
// MAX40109 Rev.3. Isolated I2C bus; external level matching, DQ high.
// No permanent programming or charge pump activation.
uint8_t client=0x4d; char line[96]; size_t pos=0; bool overflow=false;
struct Reg{uint8_t a,n;uint16_t mask;};
const Reg regs[]={{0,2,0x600f},{2,2,0},{4,1,63},{5,1,7},{6,2,0},{8,2,0},{10,1,15},{11,2,1023},{13,1,7},{14,1,15},{15,2,0},{17,2,0},{19,1,31},{20,1,7},{21,1,3},{26,2,65535},{28,1,1},{30,1,15},{162,1,0},{163,1,0},{164,1,0},{167,2,0},{169,2,0}};
const Reg* lookup(unsigned a){for(const auto &r:regs)if(r.a==a)return &r;return nullptr;}
bool rd(uint8_t a,uint8_t n,uint16_t &v){Wire.beginTransmission(client);Wire.write(a);if(Wire.endTransmission(false))return false;if(Wire.requestFrom(client,n)!=n)return false;v=Wire.read();if(n==2)v=(v<<8)|Wire.read();return true;}
bool wr(uint8_t a,uint8_t n,uint16_t v){Wire.beginTransmission(client);Wire.write(a);if(n==2)Wire.write(uint8_t(v>>8));Wire.write(uint8_t(v));return Wire.endTransmission()==0;}
void error(const char* e){Serial.print("ERR ");Serial.println(e);}
bool dump(uint16_t *d){uint16_t c,ctrl;if(!rd(0,2,c)||(c&0x8000)||!rd(0xa2,1,ctrl)||ctrl!=0)return false;if(!wr(0xa2,1,0x10))return false;bool ok=true;for(uint8_t i=0;i<69;i++){if(!wr(0xa4,1,i)||!rd(0xa7,2,d[i])){ok=false;break;}}if(!wr(0xa2,1,0))ok=false;return ok;}
bool parseHex(const char* p,unsigned n,unsigned &v){v=0;for(unsigned i=0;i<n;i++){char c=p[i];unsigned d=c>='0'&&c<='9'?c-'0':c>='A'&&c<='F'?c-'A'+10:99;if(d>15)return false;v=v*16+d;}return true;}
void command(){unsigned a,m,v;uint16_t old,actual;
 if(!strcmp(line,"HELLO")){Serial.println("MAX40109-RO 2");return;}
 if(strlen(line)==8&&!strncmp(line,"PROBE ",6)&&parseHex(line+6,2,a)&&a>=8&&a<=119){client=a;if(!rd(0,2,old)){error("I2C no response");return;}Serial.printf("OK PROBE %02X\n",a);return;}
 if(strlen(line)==7&&!strncmp(line,"READ ",5)&&parseHex(line+5,2,a)){auto r=lookup(a);if(!r||!rd(a,r->n,old)){error("read");return;}Serial.printf("OK %02X %04X\n",a,old);return;}
 if(!strcmp(line,"DUMP")){uint16_t d[69];if(!dump(d)){error("MTP read; check mode/configuration");return;}Serial.print("OK DUMP");for(auto w:d)Serial.printf(" %04X",w);Serial.println();return;}
 if(strlen(line)==18&&!strncmp(line,"PATCH ",6)&&line[8]==' '&&line[13]==' '&&parseHex(line+6,2,a)&&parseHex(line+9,4,m)&&parseHex(line+14,4,v)){auto r=lookup(a);if(!r||!m||(m&~r->mask)||(v&~m)||!rd(a,r->n,old)){error("mask or read");return;}uint16_t target=(old&~m)|v;if((a==0&&(target&0x6000)==0x6000)||(a==4&&(target&63)>19)||(a==30&&(target&15)==1)){error("reserved setting");return;}if(!wr(a,r->n,target)||!rd(a,r->n,actual)||actual!=target){error("RAM write/readback; state uncertain");return;}Serial.printf("OK PATCH %02X %04X\n",a,actual);return;}
 error("unsupported");}
void setup(){Serial.begin(115200);Wire.begin(4,5,100000);Wire.setTimeOut(100);}
void loop(){while(Serial.available()){char c=Serial.read();if(c=='\r')continue;if(c=='\n'){line[pos]=0;if(overflow)error("length");else command();pos=0;overflow=false;}else if(pos<sizeof(line)-1)line[pos++]=c;else overflow=true;}}
