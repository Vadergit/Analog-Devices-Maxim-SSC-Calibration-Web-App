// Candidate formats: Rev.3 tables 28/29 vs figure 4. NO production encoding claim.
import {hex,validateSnapshot} from './max40109.mjs';
export function encodeCoeff(v,index,format){
 if(!Number.isFinite(v)||!Number.isInteger(index)||index<0||index>=20)throw Error('Ungültiger Koeffizient');
 if(format==='float'){let b=new DataView(new ArrayBuffer(4));b.setFloat32(0,v,true);if(!Number.isFinite(b.getFloat32(0,true)))throw Error('Float overflow');return b.getUint32(0,true);}
 if(!['fixed-sign','fixed-twos'].includes(format))throw Error('Format auswählen');
 const scale=index===0||index===4?1:2**23,mag=Math.round(Math.abs(v)*scale);
 if(mag>0x7fffffff)throw Error('Koeffizient ausserhalb des Formats');
 return v<0&&mag?format==='fixed-sign'?0x80000000+mag:2**32-mag:mag;
}
export function decodeCoeff(w,index,format){
 if(!Number.isInteger(w)||w<0||w>0xffffffff)throw Error('Ungültiges Wort');
 if(format==='float'){let b=new DataView(new ArrayBuffer(4));b.setUint32(0,w,true);return b.getFloat32(0,true);}
 if(!['fixed-sign','fixed-twos'].includes(format))throw Error('Format auswählen');
 let v=w>=2**31?format==='fixed-sign'?-(w-2**31):w-2**32:w;return v/(index===0||index===4?1:2**23);
}
export function linearCandidate(f,settings,lo,hi,format,original){
 validateSnapshot(original);
 if(f?.model!=='max40109'||f.po!==1||f.to!==0||!settings||settings.source==='synthetic')throw Error('Reale oder manuelle lineare MAX40109-Druckmessung ohne TK erforderlich');
 if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<-32768||hi>32767||hi<=lo||!(settings.hi>settings.lo))throw Error('DSP-Zielbereich ungültig');
 const factor=(hi-lo)/(settings.hi-settings.lo),c=Array(16).fill(0);c[0]=lo+(f.coefficients[0]-settings.lo)*factor;c[4]=f.coefficients[1]*factor/32768;
 const words=[...original],coefficients=c.map((v,i)=>{let index=i+4,w=encodeCoeff(v,index,format);words[index*2]=w%65536;words[index*2+1]=Math.floor(w/65536);return {index,name:['H','G','N','M'][Math.floor(i/4)]+i%4,ideal:v,encoded:hex(w,8),decoded:decodeCoeff(w,index,format)};});
 const predict=raw=>coefficients[0].decoded+coefficients[4].decoded*raw;
 const residuals=settings.points.map(p=>{let target=lo+(p.reference-settings.lo)*factor;return {raw:p.raw,target,predicted:predict(p.raw),error:predict(p.raw)-target}});
 if(residuals.some(p=>!Number.isFinite(p.predicted)||p.predicted<-32768||p.predicted>32767))throw Error('DSP-Bereich überschritten');
 return {format,lo,hi,referenceLo:settings.lo,referenceHi:settings.hi,words,coefficients,residuals,experimental:true};
}
export function crc8(bytes){let crc=0;for(let byte of bytes){for(let i=0;i<8;i++){let bit=(crc^byte)&1;crc>>=1;if(bit)crc^=0x8c;byte>>=1;}}return crc;}
export function verifyRom(s){if(!/^[0-9A-F]{16}$/.test(s))throw Error('ROM-Format');let b=s.match(/../g).map(x=>parseInt(x,16));if(b[0]!==0x76||crc8(b)!==0)throw Error('MAX40109 Family-Code oder CRC ungültig');return s;}
