import test from 'node:test';import assert from 'node:assert/strict';import {recommendPga,summarize,mtpHealth,outputCheck,parseScan,offsetTrim} from '../lab-validation.mjs';
test('PGA recommendation from measured endpoints',()=>{let r=recommendPga(10,-1000,1000,25000);assert.equal(r.recommended,200);assert.equal(r.peak,20000);assert.throws(()=>recommendPga(10,-32768,1000));assert.equal(summarize([10,20,30]).mean,20);assert.equal(summarize([32767]).clipped,true)});
test('MTP diagnosis',()=>{let w=Array(69).fill(0);w[63]=0x400|31<<5;let r=mtpHealth(0x80,12,w);assert.equal(r.healthy,true);assert.equal(r.clipping.upper,31);assert.equal(mtpHealth(64,12,w).healthy,false);});
test('output and scan',()=>{assert.equal(outputCheck(50,2.5,0,100,.5,4.5,.1).pass,true);assert.equal(outputCheck(50,2.6,0,100,.5,4.5,.1).pass,false);assert.deepEqual(parseScan('OK SCAN 4D 50'),[77,80]);assert.deepEqual(parseScan('OK SCAN'),[]);});

test('matched offset trim typical only',()=>{assert.equal(offsetTrim(45).word,0x4000);assert.equal(offsetTrim(-45).word,0xc000);assert.ok(Math.abs(offsetTrim(3).estimatedResidual)<0.023);assert.throws(()=>offsetTrim(91));});
