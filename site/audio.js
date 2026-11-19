(function(){"use strict";const p=new URLSearchParams(location.search),f=window.AudioContext||window.webkitAudioContext;if(p.has("mute")||!f)return;class y{constructor(){this.chunks=[],this.at=0,this.frames=0,this.started=!1,this.underrun=0}push(n){this.chunks.push(n),this.frames+=n.length>>1,this.started=!0}read(n,u,r){const i=n.length;let a=0;for(;a<i&&this.chunks.length;){const o=this.chunks[0],R=(o.length>>1)-this.at,d=Math.min(R,i-a);for(let h=0;h<d;h++)n[a+h]=o[(this.at+h)*2],u[a+h]=o[(this.at+h)*2+1];r&&r.push(o.slice(this.at*2,(this.at+d)*2)),this.at+=d,a+=d,this.at*2>=o.length&&(this.chunks.shift(),this.at=0)}return this.frames-=a,a<i&&(n.fill(0,a),u.fill(0,a),this.started&&(this.underrun+=i-a)),a}}const l=p.has("audio-tap");let s;const q={latencyHint:"interactive",sampleRate:Number(p.get("audio-rate")||44100)};try{s=new f(q)}catch{try{s=new f({latencyHint:"interactive"})}catch{return}}const t=window.fuujinrokuAudio={rate:s.sampleRate,pushed:0,played:0,underrun:0,mode:"none",buffered(){return Math.max(0,t.pushed-t.played)},push(e){t.pushed+=e.length>>1,l&&c.pushed.push(e.slice()),m(e)},resume(){return s.resume()},suspend(){return s.suspend()},state(){return s.state}},c={pushed:[],played:[]};let g=[];function m(e){t.node?t.node.port.postMessage(e,[e.buffer]):t.queue?t.queue.push(e):g.push(e)}const M="const Queue = "+y.toString()+`;

    registerProcessor("fuujinroku-out", class extends AudioWorkletProcessor {
        constructor(options) {
            super();
            this.queue = new Queue();
            this.played = 0; this.quanta = 0; this.tap = options.processorOptions.tap ? [] : null;
            this.port.onmessage = (event) => {
                if (event.data === "flush") { this.report(true); return; }
                this.queue.push(event.data);
            };
        }
        report(flush) {
            const message = { played: this.played, underrun: this.queue.underrun };
            if (this.tap && this.tap.length) { message.tap = this.tap.splice(0); }
            if (flush) message.flushed = true;
            this.port.postMessage(message);
        }
        process(inputs, outputs) {
            const out = outputs[0];
            this.played += this.queue.read(out[0], out[1] || out[0], this.tap);
            if (++this.quanta % 2 === 0) this.report(false);
            return true;
        }
    });`;function x(e){if(t.played=e.played,t.underrun=e.underrun,e.tap)for(const n of e.tap)c.played.push(n);e.flushed&&t.onFlushed&&t.onFlushed()}async function A(){if(s.audioWorklet&&window.AudioWorkletNode)try{const u=URL.createObjectURL(new Blob([M],{type:"text/javascript"}));await s.audioWorklet.addModule(u),URL.revokeObjectURL(u);const r=new AudioWorkletNode(s,"fuujinroku-out",{numberOfInputs:0,outputChannelCount:[2],processorOptions:{tap:l}});r.port.onmessage=i=>x(i.data),r.connect(s.destination),t.node=r,t.mode="worklet";for(const i of g.splice(0))m(i);return}catch(u){console.warn("audio: AudioWorklet unavailable ("+u+"), ScriptProcessor fallback")}const e=t.queue=new y,n=s.createScriptProcessor(2048,0,2);n.onaudioprocess=u=>{const r=u.outputBuffer;t.played+=e.read(r.getChannelData(0),r.getChannelData(1),l?c.played:null),t.underrun=e.underrun},n.connect(s.destination),t.script=n,t.mode="script";for(const u of g.splice(0))m(u)}function k(){if(s.state==="running")return w();s.resume().then(()=>{s.state==="running"&&w()},()=>{})}const v=["pointerdown","mousedown","touchend","keydown","click"];function w(){for(const e of v)window.removeEventListener(e,k,!0)}for(const e of v)window.addEventListener(e,k,!0);s.resume().then(()=>{s.state==="running"&&w()},()=>{});function b(e){let n=0;for(const i of e)n+=i.length;const u=new Float32Array(n);let r=0;for(const i of e)u.set(i,r),r+=i.length;return u}t.tapReport=async function(){if(!l)return null;t.node&&await new Promise(o=>{t.onFlushed=o,t.node.port.postMessage("flush"),setTimeout(o,2e3)});const e=b(c.pushed),n=b(c.played);let u=0,r=-1;const i=Math.min(e.length,n.length);for(let o=0;o<i;o++)e[o]!==n[o]&&(u++,r<0&&(r=o));let a=0;for(let o=0;o<n.length;o++)a=Math.max(a,Math.abs(n[o]));return{mode:t.mode,state:s.state,rate:t.rate,pushedFrames:e.length>>1,playedFrames:n.length>>1,underrunFrames:t.underrun,differingSamples:u,firstDifference:r,peak:a,played:n,pushed:e}},A().catch(e=>console.warn("audio: "+e))})();
