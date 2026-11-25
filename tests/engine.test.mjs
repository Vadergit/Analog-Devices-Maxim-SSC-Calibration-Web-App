import test from 'node:test';import assert from 'node:assert/strict';
import {signed16,adc,fitSurface,predict,verify,fitTemperature,makePlan,afeEstimate} from '../engine.mjs';
test('signed conversion',()=>{assert.equal(signed16(65535),-1);assert.equal(signed16(32768),-32768);assert.equal(adc(-32768),-1);assert.throws(()=>adc(32768));});
test('linear inverted',()=>{const f=fitSurface([{raw:10000,reference:0},{raw:-10000,reference:100}],1,0);assert.ok(Math.abs(predict(f,0)-50)<1e-8);});
test('temperature cross terms',()=>{const p=[];for(const raw of [-16000,0,16000])for(const temp of [-12000,12000]){let x=raw/32768,t=temp/32768;p.push({raw,temp,reference:20+3*x+5*x*x+2*t+4*x*t});}const f=fitSurface(p,2,1);assert.ok(Math.max(...f.residuals.map(Math.abs))<1e-8);assert.ok(Math.abs(predict(f,1000,3000)-(20+3*1000/32768+5*(1000/32768)**2+2*3000/32768+4*1000*3000/32768**2))<1e-8);});
test('rank deficiency',()=>assert.throws(()=>fitSurface([{raw:1,reference:0},{raw:1,reference:1}],1,0)));
test('temperature model',()=>{let f=fitTemperature([{raw:-16384,reference:0},{raw:16384,reference:100}],1);assert.ok(Math.abs(f.k[0]-50)<1e-8);assert.ok(Math.abs(f.k[1]-100)<1e-8);});
test('verification percent FS',()=>{let f=fitSurface([{raw:0,reference:0},{raw:10000,reference:100}],1,0);let p=verify(f,[{raw:5000,reference:49}],0,100,.5)[0];assert.equal(p.pass,false);assert.ok(Math.abs(p.percent-1)<1e-8);});
test('plan and AFE',()=>{assert.equal(makePlan(0,100,4,4,-20,80).length,16);assert.throws(()=>makePlan(0,0,2,1,25,25));assert.equal(afeEstimate(0,3,4,100,1).utilization,120);});
