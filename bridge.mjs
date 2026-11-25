// Explicit read-only protocol for bundled firmware. No write command.
export class ReadBridge{
 constructor(){this.port=null;this.busy=false;}
 async connect(){if(!navigator.serial)throw Error('Web Serial benötigt Chrome/Edge und HTTPS oder localhost');if(this.port)throw Error('Bereits verbunden');const p=await navigator.serial.requestPort();await p.open({baudRate:115200});this.port=p;}
 async close(){if(this.busy)throw Error('Messung läuft');if(this.port){await this.port.close();this.port=null;}}
 async read(command){
  if(!this.port||this.busy||! /^(HELLO|READ (06|08|0F|11))$/.test(command))throw Error('Nur freigegebene Leseoperationen möglich');
  this.busy=true;let reader,writer,timer;
  try{
   reader=this.port.readable.getReader();writer=this.port.writable.getWriter();
   timer=setTimeout(()=>{reader.cancel().catch(()=>{});},2500);
   await writer.write(new TextEncoder().encode(command+'\n'));
   let buffer='',decoder=new TextDecoder();
   while(true){let {value,done}=await reader.read();if(done)throw Error('Timeout oder USB-Verbindung unterbrochen');buffer+=decoder.decode(value,{stream:true});if(buffer.length>4096)throw Error('Ungültige Antwort');
    let idx;while((idx=buffer.indexOf('\n'))>=0){let line=buffer.slice(0,idx).trim();buffer=buffer.slice(idx+1);
     if(line.startsWith('ERR '))throw Error(line);
     if(command==='HELLO'&&line==='MAX40109-RO 1')return line;
     if(command.startsWith('READ')&&new RegExp('^OK '+command.slice(5)+' [0-9A-F]{4}$').test(line))return parseInt(line.slice(-4),16);
    }
   }
  }finally{clearTimeout(timer);reader?.releaseLock();writer?.releaseLock();this.busy=false;}
 }
}
