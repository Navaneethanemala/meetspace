import { useState, useEffect, useRef, createContext, useContext } from "react";
import { supabase } from "./supabase";

// ─── CONTEXT (shared real-time state across all components) ──────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: 1, name: "Rajesh Verma", email: "rajesh@company.com", password: "admin123", role: "admin",    avatar: "RV", dept: "Management" },
  { id: 2, name: "Arjun Sharma", email: "arjun@company.com",  password: "arjun123", role: "employee", avatar: "AS", dept: "Structural" },
  { id: 3, name: "Priya Nair",   email: "priya@company.com",  password: "priya123", role: "employee", avatar: "PN", dept: "Electrical" },
  { id: 4, name: "Vikram Rao",   email: "vikram@company.com", password: "vikram123",role: "employee", avatar: "VR", dept: "Operations" },
  { id: 5, name: "Sneha Reddy",  email: "sneha@company.com",  password: "sneha123", role: "employee", avatar: "SR", dept: "Finance"    },
];

const ROOMS = [
  { id: 1, name: "Board Room",    capacity: 20, floor: "5th Floor", amenities: ["Projector","Whiteboard","VC Setup","AC"], img: "🏛️" },
  { id: 2, name: "Conference A",  capacity: 10, floor: "3rd Floor", amenities: ["Projector","Whiteboard","AC"],            img: "🖥️" },
  { id: 3, name: "Conference B",  capacity: 10, floor: "3rd Floor", amenities: ["TV Screen","Whiteboard","AC"],            img: "📺" },
  { id: 4, name: "Huddle Room",   capacity:  6, floor: "2nd Floor", amenities: ["TV Screen","AC"],                         img: "💬" },
  { id: 5, name: "Training Hall", capacity: 40, floor: "1st Floor", amenities: ["Projector","Mic System","AC","Stage"],    img: "🎓" },
];

const today    = new Date();
const todayStr = today.toISOString().split("T")[0];
const addDays  = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
const fmtTime  = (t) => { const [h, m] = t.split(":"); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
const fmtDate  = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
const mkInitials = (name) => name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const genNexCode = () => { const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({length:6},()=>a[Math.floor(Math.random()*a.length)]).join(""); };

const SEED_MEETINGS = [
  { id:1, title:"Q1 Project Review",       date:todayStr,   start:"10:00", end:"11:30", roomId:1, hostId:1, attendees:[1,2,3,4,5], agenda:"Review Q1 milestones\nDiscuss blockers\nPlan Q2 roadmap", minutes:"", actions:[{text:"Submit Q1 report",assignedTo:2,due:addDays(5),done:false}], rsvp:{1:"yes",2:"yes",3:"maybe",4:"no",5:"yes"},          link:"QREV26", type:"review"   },
  { id:2, title:"Design Sync",             date:todayStr,   start:"14:00", end:"15:00", roomId:4, hostId:3, attendees:[1,3,5],     agenda:"UI feedback\nPrototype walkthrough",                       minutes:"", actions:[],                                                              rsvp:{1:"yes",3:"yes",5:"maybe"},                          link:"DSYNC4",          type:"sync"     },
  { id:3, title:"Client Kickoff — Hitech", date:todayStr,   start:"16:00", end:"17:30", roomId:2, hostId:4, attendees:[1,4,2],     agenda:"Project scope\nTimeline\nBudget approval",                 minutes:"", actions:[],                                                              rsvp:{1:"yes",4:"yes",2:"pending"},                        link:"",                                 type:"kickoff"  },
  { id:4, title:"Safety Training",         date:addDays(1), start:"09:00", end:"12:00", roomId:5, hostId:1, attendees:[1,2,3,4,5], agenda:"Safety protocols\nSite guidelines\nQ&A",                   minutes:"", actions:[],                                                              rsvp:{1:"yes",2:"yes",3:"yes",4:"yes",5:"yes"},            link:"",                                 type:"training" },
  { id:5, title:"Budget Planning FY26",    date:addDays(2), start:"11:00", end:"13:00", roomId:2, hostId:5, attendees:[1,4,5],     agenda:"FY26 budget review\nDepartment allocations",              minutes:"", actions:[],                                                              rsvp:{1:"pending",4:"pending",5:"yes"},                    link:"BUDG26",          type:"planning" },
];

const TYPE_CFG = {
  review:   { color:"#2563eb", bg:"#dbeafe", label:"Review"   },
  sync:     { color:"#059669", bg:"#d1fae5", label:"Sync"     },
  kickoff:  { color:"#d97706", bg:"#fef3c7", label:"Kickoff"  },
  training: { color:"#7c3aed", bg:"#ede9fe", label:"Training" },
  planning: { color:"#dc2626", bg:"#fee2e2", label:"Planning" },
};
const RSVP_CFG = {
  yes:     { color:"#059669", bg:"#d1fae5", label:"Accepted" },
  no:      { color:"#dc2626", bg:"#fee2e2", label:"Declined" },
  maybe:   { color:"#d97706", bg:"#fef3c7", label:"Maybe"    },
  pending: { color:"#6b7280", bg:"#f3f4f6", label:"Pending"  },
};


// ─── NEXMEET HTML (embedded P2P video call) ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
const NEXMEET_HTML = (userName, roomCode) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>NexMeet</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#07090f;--surf:#0e1420;--s2:#151d2b;--s3:#1b2537;--cyan:#00d4ff;--purple:#7c3aed;--green:#22c55e;--red:#ef4444;--amber:#f59e0b;--text:#dde6f0;--muted:#4d6070;--border:#1d2d3f}
html,body{height:100%;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow:hidden}
.orb{position:fixed;border-radius:50%;filter:blur(110px);pointer-events:none;z-index:0}
.orb1{width:500px;height:500px;background:radial-gradient(circle,rgba(0,212,255,.07),transparent 70%);top:-180px;right:-120px}
.orb2{width:380px;height:380px;background:radial-gradient(circle,rgba(124,58,237,.06),transparent 70%);bottom:-80px;left:-80px}
#lobby{position:relative;z-index:1;height:100%;display:flex;align-items:center;justify-content:center;padding:24px}
.card{width:100%;max-width:420px;background:var(--surf);border:1px solid var(--border);border-radius:22px;padding:36px;box-shadow:0 32px 80px rgba(0,0,0,.5);position:relative}
.card::before{content:'';position:absolute;inset:0;border-radius:22px;padding:1px;background:linear-gradient(135deg,rgba(0,212,255,.25),transparent 50%,rgba(124,58,237,.15));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.logo{display:flex;align-items:center;gap:11px;margin-bottom:28px}
.logo-icon{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,var(--cyan),var(--purple));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.logo-name{font-family:'Syne',sans-serif;font-weight:800;font-size:21px;letter-spacing:-.4px}
.logo-sub{font-size:11px;color:var(--muted);margin-top:1px}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500}
.pill-cyan{background:rgba(0,212,255,.09);color:var(--cyan);border:1px solid rgba(0,212,255,.2)}
.pill-green{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.25)}
.pill-amber{background:rgba(245,158,11,.1);color:var(--amber);border:1px solid rgba(245,158,11,.25)}
.tabs{display:flex;gap:3px;background:var(--s2);padding:4px;border-radius:10px;margin-bottom:22px}
.tab{flex:1;padding:8px;border-radius:8px;border:none;background:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .18s}
.tab.on{background:var(--s3);color:var(--text)}
lbl{display:block;font-size:11px;color:var(--muted);margin-bottom:5px;letter-spacing:.04em}
.inp{width:100%;background:var(--s2);border:1px solid var(--border);border-radius:9px;padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;margin-bottom:13px}
.inp:focus{border-color:var(--cyan)}
.inp::placeholder{color:var(--muted)}
.inp.code-inp{letter-spacing:5px;font-family:'Syne',sans-serif;font-size:20px;text-transform:uppercase;text-align:center}
.btn{width:100%;padding:12px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-primary{background:var(--cyan);color:#000;box-shadow:0 0 22px rgba(0,212,255,.28)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 0 32px rgba(0,212,255,.45)}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-ghost{background:var(--s2);color:var(--text);border:1px solid var(--border);margin-bottom:10px}
.btn-ghost:hover{background:var(--s3);border-color:var(--cyan)}
.codebox{background:var(--s2);border:1px solid rgba(0,212,255,.25);border-radius:11px;padding:14px;text-align:center;margin-bottom:13px;cursor:pointer;transition:all .2s}
.codebox:hover{border-color:var(--cyan);background:rgba(0,212,255,.04)}
.codebox .codetext{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:8px;color:var(--cyan);text-shadow:0 0 16px rgba(0,212,255,.35)}
.codebox .codesub{font-size:11px;color:var(--muted);margin-top:4px}
.statusrow{display:flex;align-items:center;gap:8px;padding:9px 13px;background:var(--s2);border:1px solid var(--border);border-radius:9px;font-size:13px;color:var(--muted);margin-top:11px}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.dot-green{background:var(--green);animation:blink 1.6s infinite}
.dot-amber{background:var(--amber);animation:blink .9s infinite}
.dot-gray{background:var(--muted)}
#meeting{display:none;position:relative;z-index:1;height:100%;flex-direction:column}
.mhdr{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid var(--border);background:rgba(14,20,32,.88);backdrop-filter:blur(14px);flex-shrink:0}
.mhdr-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:15px}
.mhdr-code{font-family:'Syne',sans-serif;font-size:13px;letter-spacing:3px;color:var(--cyan)}
.mbody{flex:1;display:flex;overflow:hidden;min-height:0}
.varea{flex:1;display:flex;flex-direction:column;padding:12px;gap:10px;overflow:hidden;position:relative}
.vgrid{flex:1;display:grid;gap:10px;min-height:0}
.vgrid.g1{grid-template-columns:1fr}
.vgrid.g2{grid-template-columns:1fr 1fr}
.vtile{position:relative;background:var(--s2);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:border-color .25s,box-shadow .25s}
.vtile.speaking{border-color:var(--cyan);box-shadow:0 0 18px rgba(0,212,255,.22)}
.vtile video{width:100%;height:100%;object-fit:cover;display:block}
.vtile video.mirror{transform:scaleX(-1)}
.vtile.nocam video{display:none}
.vtag{position:absolute;bottom:10px;left:10px;background:rgba(7,9,15,.78);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:7px;padding:4px 10px;font-size:12px;display:flex;align-items:center;gap:5px}
.av{width:68px;height:68px;border-radius:50%;border:3px solid;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:24px;font-weight:800}
.waiting{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--bg)}
.spinner{width:46px;height:46px;border-radius:50%;border:3px solid var(--border);border-top-color:var(--cyan);animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sidebar{width:290px;min-width:290px;display:flex;flex-direction:column;border-left:1px solid var(--border);background:rgba(14,20,32,.7);backdrop-filter:blur(10px)}
.stabs{display:flex;border-bottom:1px solid var(--border)}
.stab{flex:1;padding:11px 0;border:none;background:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .18s;border-bottom:2px solid transparent;margin-bottom:-1px}
.stab.on{color:var(--text);border-bottom-color:var(--cyan)}
.spanel{flex:1;overflow-y:auto;padding:13px;display:none;flex-direction:column}
.spanel.on{display:flex}
.spanel::-webkit-scrollbar{width:3px}
.spanel::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.chatbox{flex:1;overflow-y:auto;margin-bottom:10px}
.chatbox::-webkit-scrollbar{width:3px}
.chatbox::-webkit-scrollbar-thumb{background:var(--border)}
.cmsg{padding:8px 11px;border-radius:9px;margin-bottom:6px;font-size:13px}
.cmsg.me{background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.14);margin-left:18px}
.cmsg.them{background:var(--s2);border:1px solid var(--border);margin-right:18px}
.cmsg .who{font-size:10px;font-weight:600;color:var(--cyan);margin-bottom:2px}
.cmsg .when{font-size:10px;color:var(--muted);text-align:right;margin-top:2px}
.chatrow{display:flex;gap:7px;flex-shrink:0}
.cinp{flex:1;background:var(--s2);border:1px solid var(--border);border-radius:9px;padding:9px 13px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.cinp:focus{border-color:var(--cyan)}
.cinp::placeholder{color:var(--muted)}
.sbtn{width:38px;height:38px;border-radius:9px;border:none;background:var(--cyan);color:#000;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.irow{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--s2);border:1px solid var(--border);border-radius:9px;margin-bottom:7px;font-size:13px}
.ilabel{font-size:11px;color:var(--muted)}
.mftr{height:68px;display:flex;align-items:center;justify-content:center;gap:7px;border-top:1px solid var(--border);background:rgba(14,20,32,.92);backdrop-filter:blur(12px);flex-shrink:0;position:relative;padding:0 18px}
.ctrl{width:44px;height:44px;border-radius:11px;border:1px solid var(--border);background:var(--s2);color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;position:relative}
.ctrl:hover{background:var(--s3);border-color:var(--cyan);color:var(--cyan)}
.ctrl.off{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:var(--red)}
.ctrl.hi{background:rgba(0,212,255,.1);border-color:rgba(0,212,255,.3);color:var(--cyan)}
.ctip{position:absolute;bottom:calc(100% + 7px);left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:11px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s;font-family:'DM Sans',sans-serif}
.ctrl:hover .ctip{opacity:1}
.endbtn{padding:0 20px;height:44px;border-radius:11px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.13);color:var(--red);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px}
.endbtn:hover{background:rgba(239,68,68,.23)}
.rtray{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--border);border-radius:14px;padding:7px 10px;display:flex;gap:5px;z-index:20}
.rbtn{width:38px;height:38px;border-radius:9px;border:none;background:var(--s3);font-size:19px;cursor:pointer;transition:transform .1s;display:flex;align-items:center;justify-content:center}
.rbtn:hover{transform:scale(1.25)}
.freact{position:absolute;font-size:34px;pointer-events:none;z-index:50;animation:floatup 2.5s ease-out forwards}
@keyframes floatup{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:.8;transform:translateY(-70px) scale(1.3)}100%{opacity:0;transform:translateY(-130px) scale(.7)}}
.waves{display:flex;align-items:center;gap:2px}
.waves span{display:block;width:3px;border-radius:2px;background:var(--cyan);animation:wv .75s ease-in-out infinite}
.waves span:nth-child(2){animation-delay:.12s}
.waves span:nth-child(3){animation-delay:.24s}
@keyframes wv{0%,100%{height:3px}50%{height:13px}}
.recpill{display:flex;align-items:center;gap:5px;padding:3px 9px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:18px;font-size:12px;color:var(--red)}
.recdot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:blink 1s infinite}
#toast{position:fixed;bottom:82px;left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--border);border-radius:9px;padding:9px 18px;font-size:13px;z-index:999;opacity:0;transition:opacity .28s;pointer-events:none;white-space:nowrap}
#toast.show{opacity:1}
#mtimer{font-family:'Syne',sans-serif;font-size:13px;color:var(--muted)}
</style>
</head>
<body>
<div class="orb orb1"></div><div class="orb orb2"></div>
<div id="toast"></div>
<div id="lobby">
<div class="card">
  <div class="logo">
    <div class="logo-icon">⚡</div>
    <div><div class="logo-name">NexMeet</div><div class="logo-sub">Real P2P · WebRTC · No servers</div></div>
    <span class="pill pill-cyan" style="margin-left:auto">LIVE</span>
  </div>
  <div class="tabs">
    <button class="tab on" id="t-join" onclick="switchTab('join')">Join Meeting</button>
    <button class="tab" id="t-create" onclick="switchTab('create')">New Meeting</button>
  </div>
  <div id="pjoin">
    <lbl>YOUR NAME</lbl>
    <input class="inp" id="jname" placeholder="Display name" maxlength="28" value="${userName}"/>
    <lbl>MEETING CODE</lbl>
    <input class="inp code-inp" id="jcode" placeholder="XXXXXX" maxlength="6" value="${roomCode}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"/>
    <button class="btn btn-primary" id="jbtn" onclick="doJoin()">🚀 Join Meeting</button>
  </div>
  <div id="pcreate" style="display:none">
    <lbl>YOUR NAME</lbl>
    <input class="inp" id="cname" placeholder="Display name" maxlength="28" value="${userName}"/>
    <lbl>SHARE THIS CODE WITH YOUR GUEST</lbl>
    <div class="codebox" onclick="copyLobbyCode()" title="Click to copy">
      <div class="codetext" id="codetext">${roomCode}</div>
      <div class="codesub">Click to copy · Share with your guest</div>
    </div>
    <button class="btn btn-primary" id="cbtn" onclick="doCreate()">⚡ Start Meeting</button>
  </div>
  <div class="statusrow">
    <div class="dot dot-gray" id="sdot"></div>
    <span id="stxt">Enter your name to get started</span>
  </div>
</div>
</div>
<div id="meeting">
  <div class="mhdr">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="mhdr-logo">⚡ NexMeet</span>
      <span style="width:1px;height:18px;background:var(--border);display:block"></span>
      <span class="mhdr-code" id="hcode"></span>
      <span id="recpill" class="recpill" style="display:none"><span class="recdot"></span> REC <span id="rectime">00:00</span></span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span id="peer-pill" style="display:none" class="pill pill-green">● Connected</span>
      <span id="wait-pill" class="pill pill-amber">Waiting for peer…</span>
      <span id="mtimer">00:00</span>
      <button onclick="copyCode()" style="padding:5px 11px;font-size:12px;width:auto;height:auto" class="btn btn-ghost">📋 Copy code</button>
    </div>
  </div>
  <div class="mbody">
    <div class="varea">
      <div class="waiting" id="waitover">
        <div class="spinner"></div>
        <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:700">Waiting for your guest…</div>
        <div style="color:var(--muted);font-size:13px;text-align:center;max-width:280px">Share the code below. As soon as they join, your call will connect automatically.</div>
        <div style="font-family:'Syne',sans-serif;font-size:34px;font-weight:800;letter-spacing:9px;color:var(--cyan);text-shadow:0 0 20px rgba(0,212,255,.4)" id="wcode"></div>
        <button onclick="copyCode()" class="btn btn-ghost" style="width:auto;padding:8px 20px;font-size:13px">📋 Copy Code</button>
      </div>
      <div class="vgrid g1" id="vgrid" style="display:none">
        <div class="vtile" id="ltile">
          <video id="lvid" autoplay muted playsinline class="mirror"></video>
          <div class="av" id="lav" style="display:none"></div>
          <div class="vtag" id="ltag"><span id="lname">You</span><span id="lmicon" style="display:none;font-size:11px">🔇</span></div>
        </div>
        <div class="vtile" id="rtile" style="display:none">
          <video id="rvid" autoplay playsinline></video>
          <div class="av" id="rav" style="display:none"></div>
          <div class="vtag" id="rtag"><span id="rname">Peer</span></div>
        </div>
      </div>
    </div>
    <div class="sidebar" id="sidebar">
      <div class="stabs">
        <button class="stab on" onclick="spanel('chat')">💬 Chat</button>
        <button class="stab" onclick="spanel('info')">ℹ️ Info</button>
      </div>
      <div class="spanel on" id="sp-chat">
        <div class="chatbox" id="chatbox"></div>
        <div class="chatrow">
          <input class="cinp" id="cinp" placeholder="Message…" maxlength="400" onkeydown="if(event.key==='Enter')sendMsg()"/>
          <button class="sbtn" onclick="sendMsg()">➤</button>
        </div>
      </div>
      <div class="spanel" id="sp-info">
        <div class="irow"><span class="ilabel">Room Code</span><span id="icode" style="font-family:'Syne',sans-serif;letter-spacing:3px;color:var(--cyan)"></span></div>
        <div class="irow"><span class="ilabel">Your Name</span><span id="iname"></span></div>
        <div class="irow"><span class="ilabel">Peer</span><span id="ipeer">Waiting…</span></div>
        <div class="irow"><span class="ilabel">Status</span><span id="istat" style="color:var(--amber)">Connecting…</span></div>
        <div class="irow"><span class="ilabel">Encryption</span><span style="color:var(--green)">🔒 DTLS-SRTP</span></div>
      </div>
    </div>
  </div>
  <div class="mftr">
    <div id="rtray" class="rtray" style="display:none">
      <button class="rbtn" onclick="react('👍')">👍</button>
      <button class="rbtn" onclick="react('❤️')">❤️</button>
      <button class="rbtn" onclick="react('😂')">😂</button>
      <button class="rbtn" onclick="react('🔥')">🔥</button>
      <button class="rbtn" onclick="react('👏')">👏</button>
      <button class="rbtn" onclick="react('😮')">😮</button>
    </div>
    <div style="position:absolute;left:16px;display:flex;gap:6px">
      <button class="ctrl" id="recbtn" onclick="toggleRec()"><span class="ctip">Record</span>⏺</button>
    </div>
    <button class="ctrl" id="micbtn" onclick="toggleMic()"><span class="ctip">Mute</span>🎙️</button>
    <button class="ctrl" id="cambtn" onclick="toggleCam()"><span class="ctip">Camera</span>📷</button>
    <button class="ctrl" onclick="toggleScreen()"><span class="ctip">Share Screen</span>🖥️</button>
    <button class="ctrl" id="handbtn" onclick="toggleHand()"><span class="ctip">Raise Hand</span>✋</button>
    <button class="ctrl" onclick="toggleRTray()"><span class="ctip">Reactions</span>😊</button>
    <button class="endbtn" onclick="endCall()">📵 Leave</button>
    <div style="position:absolute;right:16px">
      <button class="ctrl" onclick="toggleSidebar()"><span class="ctip">Panel</span>⊞</button>
    </div>
  </div>
</div>
<script>
let peer,conn,call,localStream,screenStream;
let myName='${userName}',peerName='',roomCode='${roomCode}';
let micOn=true,camOn=true,handUp=false,recording=false,recorder,recChunks=[];
let meetStart=0,timerInt,recInt,recSecs=0;
function switchTab(t){
  document.getElementById('t-join').classList.toggle('on',t==='join');
  document.getElementById('t-create').classList.toggle('on',t==='create');
  document.getElementById('pjoin').style.display=t==='join'?'':'none';
  document.getElementById('pcreate').style.display=t==='create'?'':'none';
}
function copyLobbyCode(){navigator.clipboard.writeText(roomCode).then(()=>toast('📋 Copied!')).catch(()=>{})}
function copyCode(){if(roomCode)navigator.clipboard.writeText(roomCode).then(()=>toast('📋 Code copied!')).catch(()=>{})}
function setStat(txt,type='gray'){
  document.getElementById('stxt').textContent=txt;
  const d=document.getElementById('sdot');
  d.className='dot '+(type==='green'?'dot-green':type==='amber'?'dot-amber':'dot-gray');
}
async function getMedia(){
  try{localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});document.getElementById('lvid').srcObject=localStream;setStat('Camera & mic ready','green');return true;}
  catch(e){try{localStream=await navigator.mediaDevices.getUserMedia({video:false,audio:true});document.getElementById('lvid').srcObject=localStream;camOn=false;updateCamUI();setStat('Audio only (no camera)','amber');toast('⚠️ No camera found — audio only');return true;}
  catch(e2){setStat('Media access denied');toast('❌ Allow camera/mic access and reload');return false;}}
}
async function doCreate(){
  myName=document.getElementById('cname').value.trim();
  if(!myName){toast('Enter your name first');return;}
  const btn=document.getElementById('cbtn');btn.disabled=true;btn.textContent='Setting up…';setStat('Requesting camera & mic…','amber');
  const ok=await getMedia();if(!ok){btn.disabled=false;btn.textContent='⚡ Start Meeting';return;}
  setStat('Starting meeting…','amber');
  peer=new Peer(roomCode,{debug:1});
  peer.on('error',e=>{if(e.type==='unavailable-id'){toast('⚠️ Code in use. Try joining instead.');btn.disabled=false;btn.textContent='⚡ Start Meeting';}else{toast('Error: '+e.type);btn.disabled=false;btn.textContent='⚡ Start Meeting';}});
  peer.on('open',id=>{setStat('Meeting ready — share the code!','green');enterMeeting();
    peer.on('call',incoming=>{call=incoming;call.answer(localStream);call.on('stream',rs=>{document.getElementById('rvid').srcObject=rs;onPeerStream();});call.on('close',()=>onPeerLeft());call.on('error',()=>onPeerLeft());});
    peer.on('connection',dc=>{conn=dc;conn.on('open',()=>conn.send(JSON.stringify({t:'name',n:myName})));conn.on('data',onData);conn.on('close',()=>onPeerLeft());});
  });
}
async function doJoin(){
  myName=document.getElementById('jname').value.trim();
  roomCode=document.getElementById('jcode').value.trim().toUpperCase();
  if(!myName){toast('Enter your name');return;}if(roomCode.length<4){toast('Enter the full meeting code');return;}
  const btn=document.getElementById('jbtn');btn.disabled=true;btn.textContent='Connecting…';setStat('Requesting camera & mic…','amber');
  const ok=await getMedia();if(!ok){btn.disabled=false;btn.textContent='🚀 Join Meeting';return;}
  setStat('Connecting to host…','amber');
  peer=new Peer(undefined,{debug:1});
  peer.on('error',e=>{toast('Could not connect: '+e.type);btn.disabled=false;btn.textContent='🚀 Join Meeting';setStat('Connection failed','gray');});
  peer.on('open',()=>{enterMeeting(true);
    conn=peer.connect(roomCode,{reliable:true});
    conn.on('open',()=>{conn.send(JSON.stringify({t:'name',n:myName}));call=peer.call(roomCode,localStream);call.on('stream',rs=>{document.getElementById('rvid').srcObject=rs;onPeerStream();});call.on('close',()=>onPeerLeft());call.on('error',()=>onPeerLeft());});
    conn.on('data',onData);conn.on('close',()=>onPeerLeft());conn.on('error',()=>toast('Data channel error'));setStat('Waiting for host to accept…','amber');
  });
}
function enterMeeting(isGuest=false){
  document.getElementById('lobby').style.display='none';document.getElementById('meeting').style.display='flex';
  document.getElementById('hcode').textContent=roomCode;document.getElementById('icode').textContent=roomCode;
  document.getElementById('iname').textContent=myName;document.getElementById('wcode').textContent=roomCode;
  document.getElementById('lname').textContent=myName+' (You)';setAv('lav',myName,'#00d4ff','#0a1e2e');
  document.getElementById('waitover').style.display='flex';document.getElementById('vgrid').style.display='none';
  if(isGuest) document.getElementById('waitover').querySelector('div:nth-child(2)').textContent='Connecting to host…';
  meetStart=Date.now();timerInt=setInterval(()=>{const s=Math.floor((Date.now()-meetStart)/1000);document.getElementById('mtimer').textContent=f2(Math.floor(s/60))+':'+f2(s%60);},1000);
}
function setAv(id,name,col,bg){const el=document.getElementById(id);el.textContent=name.substring(0,2).toUpperCase();el.style.color=col;el.style.background=bg;el.style.borderColor=col+'55';}
function onPeerStream(){
  document.getElementById('waitover').style.display='none';document.getElementById('vgrid').style.display='grid';
  document.getElementById('vgrid').className='vgrid g2';document.getElementById('rtile').style.display='';
  document.getElementById('peer-pill').style.display='';document.getElementById('wait-pill').style.display='none';
  document.getElementById('istat').textContent='Connected';document.getElementById('istat').style.color='var(--green)';
  toast('🟢 '+(peerName||'Peer')+' connected!');document.getElementById('ltile').style.display='';
}
function onPeerLeft(){
  document.getElementById('peer-pill').style.display='none';document.getElementById('wait-pill').style.display='';
  document.getElementById('wait-pill').textContent='Peer disconnected';document.getElementById('istat').textContent='Disconnected';
  document.getElementById('istat').style.color='var(--red)';document.getElementById('rtile').style.display='none';
  document.getElementById('vgrid').className='vgrid g1';toast('⚠️ Peer left the meeting');
}
function onData(raw){const m=JSON.parse(raw);if(m.t==='name'){peerName=m.n;document.getElementById('rname').textContent=peerName;document.getElementById('ipeer').textContent=peerName;setAv('rav',peerName,'#a78bfa','#1a0a2e');}if(m.t==='chat')addMsg(peerName,m.txt,false);if(m.t==='react')showReact(m.e,'remote');if(m.t==='hand')toast((peerName||'Peer')+(m.up?' ✋ raised hand':' lowered hand'));}
function tx(obj){if(conn&&conn.open)conn.send(JSON.stringify(obj));}
function sendMsg(){const inp=document.getElementById('cinp');const txt=inp.value.trim();if(!txt)return;inp.value='';addMsg('You',txt,true);tx({t:'chat',txt});}
function addMsg(who,txt,me){const box=document.getElementById('chatbox');const t=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});const d=document.createElement('div');d.className='cmsg '+(me?'me':'them');d.innerHTML='<div class="who">'+esc(who)+'</div><div>'+esc(txt)+'</div><div class="when">'+t+'</div>';box.appendChild(d);box.scrollTop=box.scrollHeight;spanel('chat');}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function react(e){showReact(e,'local');tx({t:'react',e});toggleRTray();}
function showReact(e,who){const tile=document.getElementById(who==='local'?'ltile':'rtile');const el=document.createElement('div');el.className='freact';el.textContent=e;el.style.left=(25+Math.random()*50)+'%';el.style.bottom='50px';tile.appendChild(el);setTimeout(()=>el.remove(),2600);}
let rtrayOpen=false;
function toggleRTray(){rtrayOpen=!rtrayOpen;document.getElementById('rtray').style.display=rtrayOpen?'flex':'none';}
function toggleMic(){micOn=!micOn;localStream?.getAudioTracks().forEach(t=>t.enabled=micOn);const b=document.getElementById('micbtn');b.innerHTML=(micOn?'🎙️':'🔇')+'<span class="ctip">'+(micOn?'Mute':'Unmute')+'</span>';b.className='ctrl '+(micOn?'':'off');document.getElementById('lmicon').style.display=micOn?'none':'';}
function toggleCam(){camOn=!camOn;localStream?.getVideoTracks().forEach(t=>t.enabled=camOn);updateCamUI();}
function updateCamUI(){const b=document.getElementById('cambtn');b.innerHTML=(camOn?'📷':'🚫')+'<span class="ctip">'+(camOn?'Stop Cam':'Start Cam')+'</span>';b.className='ctrl '+(camOn?'':'off');document.getElementById('ltile').classList.toggle('nocam',!camOn);document.getElementById('lav').style.display=camOn?'none':'';}
async function toggleScreen(){if(screenStream){screenStream.getTracks().forEach(t=>t.stop());screenStream=null;const vt=localStream?.getVideoTracks()[0];if(call&&vt){const s=call.peerConnection?.getSenders().find(s=>s.track?.kind==='video');if(s)s.replaceTrack(vt);}document.getElementById('lvid').srcObject=localStream;toast('🖥️ Screen share stopped');return;}try{screenStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});const st=screenStream.getVideoTracks()[0];if(call){const s=call.peerConnection?.getSenders().find(s=>s.track?.kind==='video');if(s)s.replaceTrack(st);}document.getElementById('lvid').srcObject=screenStream;st.onended=()=>toggleScreen();toast('🖥️ Screen sharing');}catch(e){toast('Screen share cancelled');}}
function toggleHand(){handUp=!handUp;const b=document.getElementById('handbtn');b.className='ctrl '+(handUp?'hi':'');tx({t:'hand',up:handUp});toast(handUp?'✋ Hand raised':'Hand lowered');}
function toggleRec(){if(!recording){try{recorder=new MediaRecorder(localStream,{mimeType:'video/webm;codecs=vp9,opus'});}catch(e){recorder=new MediaRecorder(localStream);}recChunks=[];recorder.ondataavailable=e=>recChunks.push(e.data);recorder.onstop=()=>{const blob=new Blob(recChunks,{type:'video/webm'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nexmeet-'+roomCode+'.webm';a.click();toast('⬇️ Recording saved!');};recorder.start(1000);recording=true;recSecs=0;document.getElementById('recpill').style.display='flex';document.getElementById('recbtn').classList.add('hi');recInt=setInterval(()=>{recSecs++;document.getElementById('rectime').textContent=f2(Math.floor(recSecs/60))+':'+f2(recSecs%60);},1000);toast('⏺️ Recording started');}else{recorder.stop();recording=false;clearInterval(recInt);document.getElementById('recpill').style.display='none';document.getElementById('recbtn').classList.remove('hi');}}
function spanel(p){document.querySelectorAll('.stab').forEach((b,i)=>b.classList.toggle('on',['chat','info'][i]===p));document.querySelectorAll('.spanel').forEach(el=>el.classList.remove('on'));document.getElementById('sp-'+p).classList.add('on');}
function toggleSidebar(){const sb=document.getElementById('sidebar');sb.style.display=sb.style.display==='none'?'':'none';}
function endCall(){call?.close();conn?.close();peer?.destroy();localStream?.getTracks().forEach(t=>t.stop());screenStream?.getTracks().forEach(t=>t.stop());clearInterval(timerInt);clearInterval(recInt);peer=conn=call=localStream=screenStream=null;micOn=true;camOn=true;handUp=false;recording=false;document.getElementById('meeting').style.display='none';document.getElementById('lobby').style.display='';document.getElementById('jbtn').disabled=false;document.getElementById('jbtn').textContent='🚀 Join Meeting';document.getElementById('cbtn').disabled=false;document.getElementById('cbtn').textContent='⚡ Start Meeting';document.getElementById('mtimer').textContent='00:00';setStat('Enter your name to get started','gray');toast('👋 You left the meeting');}
function f2(n){return String(n).padStart(2,'0')}
function toast(msg,d=2800){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),d);}
</script>
</body>
</html>`;

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#f1f5f9; font-family:'Plus Jakarta Sans',sans-serif; }
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#e2e8f0}
  ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
  .fade  { animation:fd  .3s ease; }
  .slide { animation:sl  .3s ease; }
  @keyframes fd { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sl { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 1px 4px #0000000a; }
  .btn  { border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; border-radius:10px; transition:all .18s; }
  .btn:hover  { filter:brightness(.93); transform:translateY(-1px); }
  .btn:active { transform:translateY(0); }
  .inp { background:#f8fafc; border:1.5px solid #e2e8f0; color:#1e293b; padding:11px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; width:100%; outline:none; border-radius:10px; transition:border .2s; }
  .inp:focus { border-color:#1e3a8a; background:#fff; }
  .inp::placeholder { color:#94a3b8; }
  option { background:#fff; }
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:10px; cursor:pointer; transition:all .18s; font-weight:600; font-size:14px; color:#64748b; border:none; background:none; font-family:'Plus Jakarta Sans',sans-serif; width:100%; }
  .nav-item:hover  { background:#f1f5f9; color:#1e293b; }
  .nav-item.active { background:#1e3a8a; color:#fff; }
  .chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; }
  .meeting-row { padding:16px 20px; border-radius:12px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .18s; }
  .meeting-row:hover { border-color:#1e3a8a33; box-shadow:0 4px 16px #1e3a8a10; }
  .tab-btn { background:none; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:13px; padding:9px 20px; border-bottom:2px solid transparent; transition:all .2s; color:#94a3b8; }
  .tab-btn.on { color:#1e3a8a; border-bottom:2px solid #1e3a8a; }
  .room-card { border-radius:16px; border:2px solid #e2e8f0; background:#fff; transition:all .2s; cursor:pointer; }
  .room-card:hover { border-color:#1e3a8a; box-shadow:0 8px 28px #1e3a8a18; transform:translateY(-3px); }
  .slot { padding:8px 14px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; border:1.5px solid #e2e8f0; transition:all .15s; text-align:center; font-family:'Plus Jakarta Sans',sans-serif; }
  .slot:hover:not(.taken)   { border-color:#1e3a8a; background:#eff6ff; color:#1e3a8a; }
  .slot.sel-slot  { background:#1e3a8a; color:#fff; border-color:#1e3a8a; }
  .slot.taken     { background:#fee2e2; color:#dc2626; border-color:#fecaca; cursor:not-allowed; opacity:.7; }
  .att-btn { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:10px; border:1.5px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:13px; color:#64748b; transition:all .15s; }
  .att-btn:hover { border-color:#93c5fd; background:#f0f9ff; }
  .att-btn.on { border-color:#1e3a8a; background:#eff6ff; color:#1e3a8a; }
  .av { display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; }
`;

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [nexMeet,  setNexMeet]  = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState("dashboard");
  const [toast,    setToast]    = useState(null);
  const [dbReady,  setDbReady]  = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Load users + meetings from Supabase on startup ───────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users from DB
        const { data: users, error: uErr } = await supabase.from("users").select("*");
        if (!uErr && users && users.length > 0) {
          setAccounts(users);
          setDbReady(true);
        } else {
          setAccounts(SEED_ACCOUNTS);
        }
        // Load meetings from DB
        const { data: meets, error: mErr } = await supabase
          .from("meetings")
          .select("*, meeting_attendees(*), actions(*)");
        if (!mErr && meets) {
          if (meets.length > 0) {
            const shaped = meets.map(m => ({
              ...m,
              start:     m.start_time?.slice(0,5),
              end:       m.end_time?.slice(0,5),
              roomId:    m.room_id,
              hostId:    m.host_id,
              attendees: m.meeting_attendees?.map(a => a.user_id) || [],
              rsvp:      Object.fromEntries((m.meeting_attendees || []).map(a => [a.user_id, a.rsvp])),
              actions:   (m.actions || []).map(a => ({ ...a, assignedTo: a.assigned_to, due: a.due_date })),
              minutes:   m.minutes || "",
            }));
            setMeetings(shaped);
          } else {
            setMeetings([]);
          }
        } else {
          setMeetings(SEED_MEETINGS);
        }
      } catch(e) {
        console.log("Supabase error, using demo data:", e.message);
        setAccounts(SEED_ACCOUNTS);
        setMeetings(SEED_MEETINGS);
      }
    };
    loadData();
  }, []);

  // ─── REGISTER → saves to Supabase ─────────────────────────────────────────
  const handleRegister = async (newUser) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([{
          name:     newUser.name,
          email:    newUser.email,
          password: newUser.password,
          role:     "employee",
          dept:     newUser.dept,
          avatar:   newUser.avatar,
        }])
        .select()
        .single();

      if (error) {
        // If DB not set up yet, fall back to local state
        console.log("DB insert failed, using local:", error.message);
        setAccounts(prev => [...prev, newUser]);
        setUser(newUser);
      } else {
        setAccounts(prev => [...prev, data]);
        setUser(data);
      }
    } catch(e) {
      // Offline fallback
      setAccounts(prev => [...prev, newUser]);
      setUser(newUser);
    }
    setPage("dashboard");
  };

  // ─── LOGIN → checks Supabase first ────────────────────────────────────────
  const handleLogin = async (u) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", u.email.trim().toLowerCase())
        .eq("password", u.password)
        .single();
      if (!error && data) {
        setUser(data);
        setPage("dashboard");
        return;
      }
    } catch(e) {
      console.log("DB login failed, using local:", e.message);
    }
    // Fallback to local accounts (demo/seed data)
    setUser(u);
    setPage("dashboard");
  };

  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  const ctx = { accounts, setAccounts, meetings, setMeetings, user, showToast, nexMeet, setNexMeet };

  if (!user) return (
    <AppCtx.Provider value={ctx}>
      <style>{G}</style>
      <AuthScreen accounts={accounts} onLogin={handleLogin} onRegister={handleRegister} />
    </AppCtx.Provider>
  );

  return (
    <AppCtx.Provider value={ctx}>
      <style>{G}</style>
      <div style={{ display:"flex", minHeight:"100vh", background:"#f1f5f9" }}>
        <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
        <div style={{ flex:1, overflow:"auto" }}>
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "meetings"  && <MeetingsPage />}
          {page === "rooms"     && <RoomsPage />}
          {page === "schedule"  && <SchedulePage setPage={setPage} />}
          {page === "profile"   && <ProfilePage />}
        </div>
      </div>
      {nexMeet && <NexMeetModal code={nexMeet.roomCode} userName={nexMeet.userName} onClose={() => setNexMeet(null)} />}
      {toast && (
        <div className="fade" style={{ position:"fixed", bottom:24, right:24, background:toast.type==="error"?"#fff1f2":"#f0fdf4", border:`1px solid ${toast.type==="error"?"#fecaca":"#bbf7d0"}`, color:toast.type==="error"?"#dc2626":"#15803d", padding:"13px 22px", borderRadius:12, fontWeight:700, fontSize:14, zIndex:9999, boxShadow:"0 8px 30px #00000015" }}>
          {toast.type==="error"?"⚠️":"✅"} {toast.msg}
        </div>
      )}
    </AppCtx.Provider>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ accounts, onLogin, onRegister }) {
  const [mode,  setMode]  = useState("login");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [name,  setName]  = useState("");
  const [dept,  setDept]  = useState("");
  const [err,   setErr]   = useState("");
  const [show,  setShow]  = useState(false);

  const clear = () => setErr("");

  const handleLogin = () => {
    // First check local accounts (seed data), then parent checks DB
    const found = accounts.find(a => a.email === email.trim().toLowerCase() && a.password === pass);
    if (found) { onLogin(found); return; }
    // If not in local, try DB via parent with credentials
    onLogin({ email: email.trim().toLowerCase(), password: pass });
  };

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !pass || !dept) { setErr("Please fill all fields."); return; }
    if (pass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase())) { setErr("Email already registered."); return; }
    const newUser = { id: Date.now(), name: name.trim(), email: email.trim().toLowerCase(), password: pass, role: "employee", avatar: mkInitials(name), dept };
    onRegister(newUser);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1e40af 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ display:"flex", width:"100%", maxWidth:980, borderRadius:24, overflow:"hidden", boxShadow:"0 32px 80px #00000055" }}>

        {/* Left branding */}
        <div style={{ flex:1, background:"linear-gradient(160deg,#1e3a8a,#0f172a)", padding:"56px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
              <div style={{ width:42, height:42, background:"#fff", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>📅</div>
              <div style={{ fontFamily:"'Lora',serif", fontSize:24, fontWeight:700, color:"#fff" }}>MeetSpace</div>
            </div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:34, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:18 }}>Your company's meeting hub</div>
            <div style={{ color:"#93c5fd", fontSize:15, lineHeight:1.9 }}>Book rooms, schedule meetings, track agendas and action items — all in one place.</div>
          </div>
          <div>
            {[["📋","Schedule & manage meetings"],["🚪","Book conference rooms instantly"],["🔔","Never miss a meeting"],["✅","Track action items & minutes"]].map(([icon,text])=>(
              <div key={text} style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <span style={{ color:"#bfdbfe", fontSize:14 }}>{text}</span>
              </div>
            ))}
            <div style={{ marginTop:28, background:"#ffffff0f", borderRadius:12, padding:"16px 18px" }}>
              <div style={{ color:"#60a5fa", fontSize:11, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:".08em" }}>Demo Accounts</div>
              {accounts.slice(0,3).map(a=>(
                <div key={a.id} style={{ color:"#93c5fd", fontSize:12, lineHeight:2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{a.email} / <span style={{ color:"#bfdbfe" }}>{a.password}</span></span>
                  <span style={{ background:"#ffffff15", color:"#a5b4fc", fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:700 }}>{a.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form */}
        <div style={{ width:430, background:"#fff", padding:"52px 44px", display:"flex", flexDirection:"column", justifyContent:"center" }} className="fade">
          <div style={{ fontFamily:"'Lora',serif", fontSize:28, fontWeight:700, color:"#0f172a", marginBottom:6 }}>
            {mode==="login" ? "Welcome back" : "Create account"}
          </div>
          <div style={{ color:"#64748b", fontSize:14, marginBottom:30 }}>
            {mode==="login" ? "Sign in to your workspace" : "Join your company workspace"}
          </div>

          {err && <div style={{ background:"#fff1f2", border:"1px solid #fecaca", color:"#dc2626", padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600, marginBottom:16 }}>⚠️ {err}</div>}

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register" && (
              <>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Full Name</label>
                  <input className="inp" placeholder="e.g. Kiran Patel" value={name} onChange={e=>{setName(e.target.value);clear();}} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Department</label>
                  <select className="inp" value={dept} onChange={e=>{setDept(e.target.value);clear();}}>
                    <option value="">Select your department...</option>
                    {["Engineering","Design","Finance","Operations","Management","HR","Sales","Legal","Marketing"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Work Email</label>
              <input className="inp" type="email" placeholder="you@company.com" value={email} onChange={e=>{setEmail(e.target.value);clear();}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input className="inp" type={show?"text":"password"} placeholder="••••••••" value={pass} onChange={e=>{setPass(e.target.value);clear();}} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} style={{ paddingRight:44 }} />
                <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:16 }}>{show?"🙈":"👁️"}</button>
              </div>
            </div>
          </div>

          <button className="btn" onClick={mode==="login"?handleLogin:handleRegister}
            style={{ background:"#1e3a8a", color:"#fff", padding:"14px 0", fontSize:15, width:"100%", marginTop:26 }}>
            {mode==="login" ? "Sign In →" : "Create Account →"}
          </button>

          <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#94a3b8" }}>
            {mode==="login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={()=>{setMode(mode==="login"?"register":"login");setErr("");}} style={{ color:"#1e3a8a", fontWeight:700, cursor:"pointer" }}>
              {mode==="login" ? "Register here" : "Sign In"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, onLogout }) {
  const { user, meetings } = useApp();
  const pending = meetings.filter(m => m.rsvp[user.id] === "pending").length;
  const nav = [
    { id:"dashboard", icon:"🏠", label:"Dashboard" },
    { id:"meetings",  icon:"📅", label:"My Meetings", badge:pending },
    { id:"rooms",     icon:"🚪", label:"Book a Room" },
    { id:"schedule",  icon:"➕", label:"Schedule Meeting" },
    { id:"profile",   icon:"👤", label:"My Profile" },
  ];
  return (
    <div style={{ width:242, background:"#fff", borderRight:"1px solid #e2e8f0", display:"flex", flexDirection:"column", padding:"0 12px", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
      <div style={{ padding:"22px 8px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:36, height:36, background:"#1e3a8a", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📅</div>
        <div style={{ fontFamily:"'Lora',serif", fontWeight:700, fontSize:18, color:"#0f172a" }}>MeetSpace</div>
      </div>
      <div style={{ margin:"14px 0", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"12px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="av" style={{ width:36, height:36, background:"#1e3a8a", fontSize:12, borderRadius:10 }}>{user.avatar}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ fontSize:11, color:user.role==="admin"?"#7c3aed":"#059669", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>{user.role}</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", padding:"6px 16px 4px" }}>Navigation</div>
        {nav.map(item=>(
          <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>setPage(item.id)}>
            <span style={{ fontSize:18 }}>{item.icon}</span>
            <span style={{ flex:1, textAlign:"left" }}>{item.label}</span>
            {item.badge>0&&<span style={{ background:page===item.id?"#fff":"#1e3a8a", color:page===item.id?"#1e3a8a":"#fff", fontSize:11, fontWeight:800, padding:"2px 7px", borderRadius:20 }}>{item.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:12, paddingBottom:16 }}>
        <button className="nav-item" onClick={onLogout} style={{ color:"#dc2626" }}><span>🚪</span> Sign Out</button>
      </div>
    </div>
  );
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────
function Page({ title, subtitle, children }) {
  return (
    <div className="fade" style={{ padding:"36px 40px", maxWidth:1100, margin:"0 auto" }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Lora',serif", fontSize:28, fontWeight:700, color:"#0f172a" }}>{title}</div>
        {subtitle && <div style={{ color:"#64748b", fontSize:14, marginTop:5 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── ATTENDEE PICKER — reads from live accounts context ───────────────────────
function AttendeePicker({ selected, onChange }) {
  const { accounts, user } = useApp();
  const toggle = (id) => {
    if (id === user.id) return; // host always included
    onChange(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
        Invite Team Members
        <span style={{ color:"#94a3b8", fontWeight:400, textTransform:"none", fontSize:12, marginLeft:6 }}>
          ({accounts.length} registered)
        </span>
      </div>
      {accounts.length === 0 && <div style={{ color:"#94a3b8", fontSize:13 }}>No other members yet.</div>}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {accounts.map(a => {
          const on   = selected.includes(a.id);
          const isMe = a.id === user.id;
          return (
            <button key={a.id} className={`att-btn ${on?"on":""}`}
              onClick={() => toggle(a.id)}
              title={`${a.name} — ${a.email}`}
              style={{ opacity:isMe?.75:1, cursor:isMe?"default":"pointer" }}>
              <div className="av" style={{ width:28, height:28, background:on?"#1e3a8a":"#cbd5e1", fontSize:11, borderRadius:8 }}>{a.avatar}</div>
              <div style={{ textAlign:"left", lineHeight:1.3 }}>
                <div style={{ fontWeight:700 }}>{a.name.split(" ")[0]} {a.name.split(" ")[1]?.[0]}.</div>
                <div style={{ fontSize:10, color:on?"#3b82f6":"#94a3b8" }}>{a.dept}</div>
              </div>
              {isMe && <span style={{ fontSize:10, color:"#94a3b8", marginLeft:2 }}>you</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const { user, meetings, setMeetings, showToast, accounts } = useApp();
  const [sel, setSel] = useState(null);
  const todayMs  = meetings.filter(m => m.date===todayStr && m.attendees.includes(user.id));
  const upcoming = meetings.filter(m => m.date>todayStr   && m.attendees.includes(user.id)).sort((a,b)=>a.date.localeCompare(b.date));
  const pending  = meetings.filter(m => m.rsvp[user.id]==="pending");

  const updateRSVP = (id, s) => {
    setMeetings(p=>p.map(m=>m.id===id?{...m,rsvp:{...m.rsvp,[user.id]:s}}:m));
    showToast(`RSVP: ${RSVP_CFG[s].label}`);
  };

  return (
    <Page title={`Good day, ${user.name.split(" ")[0]} 👋`} subtitle="Here's your meeting overview for today">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {[
          { label:"Today's Meetings", val:todayMs.length,  icon:"📅", color:"#2563eb" },
          { label:"Upcoming",         val:upcoming.length, icon:"📆", color:"#7c3aed" },
          { label:"Pending RSVPs",    val:pending.length,  icon:"⏳", color:"#d97706" },
          { label:"Team Members",     val:accounts.length, icon:"👥", color:"#059669" },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:22, borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ color:"#94a3b8", fontSize:12, fontWeight:600, marginBottom:8 }}>{s.label}</div>
                <div style={{ fontFamily:"'Lora',serif", fontSize:38, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
              </div>
              <span style={{ fontSize:28, opacity:.6 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:20 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:18 }}>Today's Meetings</div>
          {todayMs.length===0&&<div style={{ color:"#94a3b8", textAlign:"center", padding:"40px 0" }}>No meetings today 🎉</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {todayMs.map(m=>{
              const tc=TYPE_CFG[m.type]; const rsvp=RSVP_CFG[m.rsvp[user.id]||"pending"]; const room=ROOMS.find(r=>r.id===m.roomId);
              return (
                <div key={m.id} className="meeting-row" onClick={()=>setSel(m)} style={{ borderLeft:`3px solid ${tc.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{m.title}</div>
                      <div style={{ color:"#64748b", fontSize:12, marginTop:3 }}>⏰ {fmtTime(m.start)}–{fmtTime(m.end)} · 🚪 {room?.name}</div>
                    </div>
                    <span className="chip" style={{ background:rsvp.bg, color:rsvp.color }}>{rsvp.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:14 }}>Pending RSVPs</div>
            {pending.length===0&&<div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"16px 0" }}>All caught up! ✅</div>}
            {pending.slice(0,3).map(m=>(
              <div key={m.id} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:4 }}>{m.title}</div>
                <div style={{ color:"#94a3b8", fontSize:12, marginBottom:8 }}>{fmtDate(m.date)} · {fmtTime(m.start)}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["yes","maybe","no"].map(s=>(
                    <button key={s} className="btn" onClick={()=>updateRSVP(m.id,s)} style={{ flex:1, background:RSVP_CFG[s].bg, color:RSVP_CFG[s].color, padding:"7px 0", fontSize:12 }}>
                      {s==="yes"?"✓":s==="maybe"?"?":"✗"} {RSVP_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:14 }}>Upcoming</div>
            {upcoming.slice(0,5).map(m=>{
              const tc=TYPE_CFG[m.type];
              return (
                <div key={m.id} onClick={()=>setSel(m)} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }}>
                  <div style={{ width:42, height:42, background:tc.bg, borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:tc.color, lineHeight:1 }}>{new Date(m.date+"T00:00:00").getDate()}</div>
                    <div style={{ fontSize:9, color:tc.color, fontWeight:700 }}>{new Date(m.date+"T00:00:00").toLocaleDateString("en",{month:"short"}).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{m.title}</div>
                    <div style={{ color:"#94a3b8", fontSize:12, marginTop:2 }}>{fmtTime(m.start)} · {ROOMS.find(r=>r.id===m.roomId)?.name}</div>
                  </div>
                </div>
              );
            })}
            {upcoming.length===0&&<div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:"16px 0" }}>No upcoming meetings</div>}
          </div>
        </div>
      </div>
      {sel&&<MeetingDrawer meeting={sel} onClose={()=>setSel(null)} />}
    </Page>
  );
}

// ─── MY MEETINGS PAGE ─────────────────────────────────────────────────────────
function MeetingsPage() {
  const { user, meetings, accounts, setNexMeet } = useApp();
  const [filter, setFilter] = useState("all");
  const [sel,    setSel]    = useState(null);
  const mine     = meetings.filter(m=>m.attendees.includes(user.id));
  const filtered = filter==="all"?mine:mine.filter(m=>filter==="today"?m.date===todayStr:filter==="upcoming"?m.date>todayStr:m.date<todayStr);
  return (
    <Page title="My Meetings" subtitle="All meetings you're part of">
      <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", marginBottom:24 }}>
        {[["all","All"],["today","Today"],["upcoming","Upcoming"],["past","Past"]].map(([k,v])=>(
          <button key={k} className={`tab-btn ${filter===k?"on":""}`} onClick={()=>setFilter(k)}>{v}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94a3b8" }}>No meetings found</div>}
        {filtered.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)).map(m=>{
          const tc=TYPE_CFG[m.type]; const room=ROOMS.find(r=>r.id===m.roomId);
          const rsvp=RSVP_CFG[m.rsvp[user.id]||"pending"]; const host=accounts.find(a=>a.id===m.hostId);
          return (
            <div key={m.id} className="meeting-row" onClick={()=>setSel(m)} style={{ borderLeft:`4px solid ${tc.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>{m.title}</div>
                    <span className="chip" style={{ background:tc.bg, color:tc.color }}>{tc.label}</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:14, color:"#64748b", fontSize:13 }}>
                    <span>📅 {fmtDate(m.date)}</span>
                    <span>⏰ {fmtTime(m.start)}–{fmtTime(m.end)}</span>
                    <span>🚪 {room?.name}</span>
                    <span>👤 {host?.name}</span>
                    <span>👥 {m.attendees.length}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginLeft:16 }}>
                  <span className="chip" style={{ background:rsvp.bg, color:rsvp.color }}>{rsvp.label}</span>
                  {m.link&&<button onClick={e=>{e.stopPropagation();setNexMeet({roomCode:m.link,userName:user.name});}} style={{ background:"#1e3a8a", color:"#fff", padding:"5px 14px", borderRadius:8, fontSize:12, fontWeight:700, border:"none", cursor:"pointer" }}>🎥 Join Call</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {sel&&<MeetingDrawer meeting={sel} onClose={()=>setSel(null)} />}
    </Page>
  );
}

// ─── ROOMS PAGE ───────────────────────────────────────────────────────────────
function RoomsPage() {
  const { user, meetings, setMeetings, showToast } = useApp();
  const [step,      setStep]      = useState(1);
  const [selRoom,   setSelRoom]   = useState(null);
  const [bookDate,  setBookDate]  = useState(todayStr);
  const [selSlot,   setSelSlot]   = useState(null);
  const [title,     setTitle]     = useState("");
  const [agenda,    setAgenda]    = useState("");
  const [attendees, setAttendees] = useState([user.id]);
  const [link,      setLink]      = useState("");

  const SLOTS = [
    {start:"08:00",end:"09:00"},{start:"09:00",end:"10:00"},{start:"10:00",end:"11:00"},
    {start:"11:00",end:"12:00"},{start:"12:00",end:"13:00"},{start:"13:00",end:"14:00"},
    {start:"14:00",end:"15:00"},{start:"15:00",end:"16:00"},{start:"16:00",end:"17:00"},
    {start:"17:00",end:"18:00"},
  ];
  const isTaken = (slot) => meetings.some(m=>m.roomId===selRoom?.id&&m.date===bookDate&&!(slot.end<=m.start||slot.start>=m.end));

  const confirm = () => {
    if (!title.trim()) { showToast("Enter a meeting title","error"); return; }
    if (!selSlot)      { showToast("Select a time slot","error"); return; }
    if (isTaken(selSlot)) { showToast("Slot just got taken! Pick another","error"); return; }
    const rsvp={}; attendees.forEach(id=>rsvp[id]=id===user.id?"yes":"pending");
    setMeetings(p=>[...p,{ id:Date.now(), title:title.trim(), date:bookDate, start:selSlot.start, end:selSlot.end, roomId:selRoom.id, hostId:user.id, attendees:[...attendees], agenda, minutes:"", actions:[], rsvp, link, type:"sync" }]);
    showToast(`${selRoom.name} booked for ${fmtTime(selSlot.start)}!`);
    setStep(1); setSelRoom(null); setSelSlot(null); setTitle(""); setAgenda(""); setLink(""); setAttendees([user.id]);
  };

  return (
    <Page title="Book a Room" subtitle="Browse rooms, pick a slot, confirm your booking">
      {step===1&&(
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontWeight:700, color:"#64748b" }}>Select a room to get started</div>
            <input type="date" className="inp" value={bookDate} onChange={e=>{setBookDate(e.target.value);setSelSlot(null);}} style={{ width:180 }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:18 }}>
            {ROOMS.map(room=>{
              const booked=meetings.filter(m=>m.roomId===room.id&&m.date===bookDate);
              return (
                <div key={room.id} className="room-card" onClick={()=>{setSelRoom(room);setStep(2);}} style={{ padding:26 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <span style={{ fontSize:44 }}>{room.img}</span>
                    <span className="chip" style={{ background:booked.length>0?"#fee2e2":"#d1fae5", color:booked.length>0?"#dc2626":"#059669" }}>
                      {booked.length>0?`${booked.length} booked`:"Free"}
                    </span>
                  </div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#0f172a", marginBottom:4 }}>{room.name}</div>
                  <div style={{ color:"#64748b", fontSize:13, marginBottom:14 }}>{room.floor} · {room.capacity} seats</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom: booked.length>0?14:0 }}>
                    {room.amenities.map(a=><span key={a} style={{ background:"#f1f5f9", color:"#475569", fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:600 }}>{a}</span>)}
                  </div>
                  {booked.length>0&&(
                    <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:6, textTransform:"uppercase" }}>Booked slots</div>
                      {booked.map(m=><div key={m.id} style={{ fontSize:12, color:"#64748b", marginBottom:3 }}>• {fmtTime(m.start)}–{fmtTime(m.end)}: {m.title}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {step===2&&selRoom&&(
        <div className="slide" style={{ display:"grid", gridTemplateColumns:"1fr 1.15fr", gap:24 }}>
          <div>
            <button onClick={()=>{setStep(1);setSelSlot(null);}} style={{ background:"none", border:"none", color:"#1e3a8a", fontWeight:700, cursor:"pointer", fontSize:14, marginBottom:20, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Back to rooms</button>
            <div className="card" style={{ padding:26 }}>
              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:22 }}>
                <span style={{ fontSize:42 }}>{selRoom.img}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#0f172a" }}>{selRoom.name}</div>
                  <div style={{ color:"#64748b", fontSize:13 }}>{selRoom.floor} · {selRoom.capacity} seats</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>Pick a Time Slot</div>
                <input type="date" className="inp" value={bookDate} onChange={e=>{setBookDate(e.target.value);setSelSlot(null);}} style={{ width:160, fontSize:12 }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {SLOTS.map(slot=>{
                  const taken=isTaken(slot); const isSel=selSlot?.start===slot.start;
                  return (
                    <div key={slot.start} className={`slot ${taken?"taken":isSel?"sel-slot":""}`} onClick={()=>!taken&&setSelSlot(isSel?null:slot)}>
                      {fmtTime(slot.start)} – {fmtTime(slot.end)}
                      {taken&&<div style={{ fontSize:10, marginTop:2, opacity:.8 }}>Already booked</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:16 }}>
                {[["#1e3a8a","Selected"],["#f1f5f9","Available"],["#fee2e2","Booked"]].map(([bg,label])=>(
                  <div key={label} style={{ display:"flex", gap:6, alignItems:"center", fontSize:12, color:"#64748b" }}>
                    <div style={{ width:14, height:14, borderRadius:4, background:bg, border:"1px solid #e2e8f0" }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding:30 }}>
            <div style={{ fontWeight:800, fontSize:18, color:"#0f172a", marginBottom:22 }}>Booking Details</div>
            {selSlot ? (
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
                <div style={{ fontWeight:700, color:"#1e3a8a" }}>🕐 {fmtTime(selSlot.start)} – {fmtTime(selSlot.end)}</div>
                <div style={{ color:"#3b82f6", fontSize:13 }}>{selRoom.name} · {fmtDate(bookDate)}</div>
              </div>
            ) : (
              <div style={{ background:"#fafafa", border:"1px dashed #cbd5e1", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#94a3b8", fontSize:13 }}>← Select a time slot first</div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Meeting Title *</label>
                <input className="inp" placeholder="e.g. Team Standup" value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Agenda</label>
                <textarea className="inp" rows={3} placeholder="Optional agenda..." value={agenda} onChange={e=>setAgenda(e.target.value)} style={{ resize:"none" }} />
              </div>
              {/* ✅ Live attendee picker — newly registered users appear here automatically */}
              <AttendeePicker selected={attendees} onChange={setAttendees} />
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Meeting Link (optional)</label>
                <input className="inp" placeholder="Zoom / Google Meet URL..." value={link} onChange={e=>setLink(e.target.value)} />
              </div>
            </div>
            <button className="btn" onClick={confirm} style={{ background:"#1e3a8a", color:"#fff", padding:"14px 0", fontSize:15, width:"100%", marginTop:22 }}>
              📅 Confirm Booking
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}

// ─── SCHEDULE PAGE ────────────────────────────────────────────────────────────
function SchedulePage({ setPage }) {
  const { user, meetings, setMeetings, showToast } = useApp();
  const [form,      setForm]      = useState({ title:"", date:todayStr, start:"10:00", end:"11:00", roomId:"", type:"sync", agenda:"", link:genNexCode() });
  const [attendees, setAttendees] = useState([user.id]);

  const submit = async () => {
    if (!form.title||!form.roomId) { showToast("Fill all required fields","error"); return; }
    if (form.start>=form.end)      { showToast("End time must be after start","error"); return; }
    const conflict=meetings.find(m=>m.roomId===parseInt(form.roomId)&&m.date===form.date&&!(form.end<=m.start||form.start>=m.end));
    if (conflict) { showToast(`Room conflict with "${conflict.title}"`, "error"); return; }
    const rsvp={}; attendees.forEach(id=>rsvp[id]=id===user.id?"yes":"pending");
    const localMeeting = {...form,id:Date.now(),roomId:parseInt(form.roomId),attendees:[...attendees],hostId:user.id,rsvp,minutes:"",actions:[]};

    // Save to Supabase
    try {
      const { data: saved, error } = await supabase
        .from("meetings")
        .insert([{
          title:      form.title,
          date:       form.date,
          start_time: form.start,
          end_time:   form.end,
          room_id:    parseInt(form.roomId),
          host_id:    user.id,
          agenda:     form.agenda,
          link:       form.link,
          type:       form.type,
          minutes:    "",
        }])
        .select()
        .single();

      if (!error && saved) {
        // Insert attendees
        const attendeeRows = attendees.map(id => ({ meeting_id: saved.id, user_id: id, rsvp: id===user.id?"yes":"pending" }));
        await supabase.from("meeting_attendees").insert(attendeeRows);
        setMeetings(p=>[...p,{...localMeeting, id: saved.id}]);
      } else {
        setMeetings(p=>[...p, localMeeting]);
      }
    } catch(e) {
      // Offline fallback
      setMeetings(p=>[...p, localMeeting]);
    }
    showToast("Meeting scheduled!"); setPage("meetings");
  };

  return (
    <Page title="Schedule a Meeting" subtitle="Create a new meeting and invite your team">
      <div style={{ maxWidth:720 }}>
        <div className="card" style={{ padding:36 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Meeting Title *</label>
              <input className="inp" placeholder="e.g. Weekly Standup" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Date *</label>
                <input type="date" className="inp" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Start</label>
                <input type="time" className="inp" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>End</label>
                <input type="time" className="inp" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Room *</label>
                <select className="inp" value={form.roomId} onChange={e=>setForm(f=>({...f,roomId:e.target.value}))}>
                  <option value="">Select a room...</option>
                  {ROOMS.map(r=><option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Type</label>
                <select className="inp" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {Object.entries(TYPE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            {/* ✅ Real-time attendee picker — any new registered user shows up here */}
            <AttendeePicker selected={attendees} onChange={setAttendees} />
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Agenda</label>
              <textarea className="inp" rows={4} placeholder="List agenda points..." value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} style={{ resize:"vertical" }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#64748b", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Meeting Link (optional)</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input className="inp" placeholder="Auto-generated NexMeet code" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6)}))} style={{ fontFamily:"monospace", letterSpacing:4, fontWeight:700, fontSize:16, textTransform:"uppercase" }} />
                <button type="button" className="btn" onClick={()=>setForm(f=>({...f,link:genNexCode()}))} style={{ background:"#f1f5f9", color:"#1e3a8a", padding:"0 16px", height:44, width:"auto", whiteSpace:"nowrap", flexShrink:0 }}>🔄 New Code</button>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:-8 }}>This is your NexMeet room code — share it with attendees to join the video call</div>
            </div>
            <button className="btn" onClick={submit} style={{ background:"#1e3a8a", color:"#fff", padding:"14px 0", fontSize:15, width:"100%" }}>
              📅 Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, meetings, accounts } = useApp();
  const mine    = meetings.filter(m=>m.attendees.includes(user.id));
  const hosted  = meetings.filter(m=>m.hostId===user.id);
  const actions = mine.flatMap(m=>(m.actions||[]).filter(a=>a.assignedTo===user.id&&!a.done));

  return (
    <Page title="My Profile" subtitle="Your account and activity summary">
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card" style={{ padding:32, textAlign:"center" }}>
            <div className="av" style={{ width:80, height:80, background:"#1e3a8a", fontSize:28, borderRadius:20, margin:"0 auto 16px" }}>{user.avatar}</div>
            <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"#0f172a" }}>{user.name}</div>
            <div style={{ color:"#64748b", fontSize:14, marginTop:4 }}>{user.dept}</div>
            <span className="chip" style={{ background:user.role==="admin"?"#ede9fe":"#d1fae5", color:user.role==="admin"?"#7c3aed":"#059669", marginTop:10, fontSize:12, padding:"5px 14px" }}>{user.role.toUpperCase()}</span>
            <div style={{ borderTop:"1px solid #f1f5f9", marginTop:20, paddingTop:16, textAlign:"left" }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:4 }}>EMAIL</div>
              <div style={{ fontSize:14, fontWeight:600, wordBreak:"break-all" }}>{user.email}</div>
            </div>
          </div>
          <div className="card" style={{ padding:22 }}>
            <div style={{ fontWeight:800, fontSize:15, color:"#0f172a", marginBottom:14 }}>Activity</div>
            {[["Total Meetings",mine.length,"#2563eb"],["Hosted",hosted.length,"#7c3aed"],["Team Size",accounts.length,"#059669"],["Pending Actions",actions.length,"#d97706"]].map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ color:"#64748b", fontSize:13 }}>{l}</span>
                <span style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:16 }}>Pending Action Items</div>
            {actions.length===0&&<div style={{ color:"#94a3b8", textAlign:"center", padding:"20px 0" }}>No pending actions 🎉</div>}
            {actions.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ width:8, height:8, background:"#d97706", borderRadius:"50%", marginTop:6, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{a.text}</div>
                  {a.due&&<div style={{ color:a.due<todayStr?"#dc2626":"#94a3b8", fontSize:12, marginTop:2 }}>📅 Due: {fmtDate(a.due)}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding:24 }}>
            <div style={{ fontWeight:800, fontSize:16, color:"#0f172a", marginBottom:16 }}>
              All Team Members
              <span style={{ background:"#f1f5f9", color:"#64748b", fontSize:12, padding:"3px 10px", borderRadius:20, marginLeft:10, fontWeight:600 }}>{accounts.length}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {accounts.map(a=>(
                <div key={a.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                  <div className="av" style={{ width:36, height:36, background:"#1e3a8a", fontSize:12, borderRadius:9 }}>{a.avatar}</div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                    <div style={{ color:"#94a3b8", fontSize:11 }}>{a.dept}</div>
                  </div>
                  {a.id===user.id&&<span style={{ fontSize:10, background:"#dbeafe", color:"#2563eb", padding:"1px 6px", borderRadius:20, fontWeight:700, flexShrink:0 }}>You</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ─── MEETING DRAWER ───────────────────────────────────────────────────────────
function MeetingDrawer({ meeting: initM, onClose }) {
  const { user, meetings, setMeetings, showToast, accounts, setNexMeet } = useApp();
  const [activeTab,    setActiveTab]    = useState("agenda");
  const [newAction,    setNewAction]    = useState({ text:"", assignedTo:"", due:"" });
  const [editMinutes,  setEditMinutes]  = useState(false);
  const [minutesDraft, setMinutesDraft] = useState("");

  // Always read live meeting from state so actions/minutes update instantly
  const m = meetings.find(x => x.id === initM.id) ?? initM;

  // All derived values — safe with optional chaining
  const room     = ROOMS.find(r => r.id === m?.roomId);
  const host     = accounts.find(a => a.id === m?.hostId);
  const tc       = TYPE_CFG[m?.type] ?? TYPE_CFG.sync;
  const myRsvp   = m?.rsvp?.[user.id] ?? "pending";
  const actions  = m?.actions ?? [];
  const doneCount = actions.filter(a => a.done).length;
  const bgColors  = ["#1e3a5f","#1a3d2e","#3d1a1a","#1e2d3d","#2d1e3d"];
  const headerBg  = bgColors[(m?.roomId ?? 1) - 1] ?? "#1e3a5f";

  const updateRSVP = (s) => {
    setMeetings(p => p.map(x => x.id === m.id ? { ...x, rsvp: { ...x.rsvp, [user.id]: s } } : x));
    showToast("RSVP updated: " + RSVP_CFG[s].label);
  };

  const openEditMinutes = () => { setMinutesDraft(m.minutes || ""); setEditMinutes(true); };
  const saveMinutes = () => {
    setMeetings(p => p.map(x => x.id === m.id ? { ...x, minutes: minutesDraft } : x));
    setEditMinutes(false);
    showToast("Minutes saved!");
  };

  const addAction = () => {
    if (!newAction.text.trim() || !newAction.assignedTo) {
      showToast("Please fill in description and assign to someone", "error");
      return;
    }
    const entry = { text: newAction.text.trim(), assignedTo: parseInt(newAction.assignedTo), due: newAction.due, done: false };
    setMeetings(p => p.map(x => x.id === m.id ? { ...x, actions: [...(x.actions ?? []), entry] } : x));
    setNewAction({ text:"", assignedTo:"", due:"" });
    showToast("Action item added!");
  };

  const toggleAction = (idx) => {
    setMeetings(p => p.map(x =>
      x.id === m.id
        ? { ...x, actions: x.actions.map((a, i) => i === idx ? { ...a, done: !a.done } : a) }
        : x
    ));
  };

  // If meeting not found at all, just show nothing (don't call onClose during render)
  if (!m) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000040", zIndex:50, display:"flex", justifyContent:"flex-end" }} onClick={onClose}>
      <div className="slide" style={{ width:480, height:"100vh", background:"#fff", boxShadow:"-12px 0 48px #00000018", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ background:headerBg, padding:"28px 28px 22px", color:"#fff", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <span className="chip" style={{ background:"#ffffff33", color:"#fff" }}>{tc.label}</span>
            <button onClick={onClose} style={{ background:"#ffffff22", border:"none", color:"#fff", cursor:"pointer", width:30, height:30, borderRadius:8, fontSize:16 }}>✕</button>
          </div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, lineHeight:1.3, marginBottom:12 }}>{m.title}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, opacity:.85, fontSize:13 }}>
            <span>📅 {fmtDate(m.date)}</span>
            <span>⏰ {fmtTime(m.start)}–{fmtTime(m.end)}</span>
            <span>🚪 {room?.name ?? "—"}</span>
          </div>
          {myRsvp === "pending" ? (
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              {["yes","maybe","no"].map(s => (
                <button key={s} className="btn" onClick={() => updateRSVP(s)}
                  style={{ flex:1, background:"#ffffff33", color:"#fff", padding:"8px 0", fontSize:12, border:"1px solid #ffffff55" }}>
                  {s==="yes" ? "✓ Accept" : s==="maybe" ? "? Maybe" : "✗ Decline"}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginTop:12, display:"flex", gap:10, flexWrap:"wrap" }}>
              <span className="chip" style={{ background:"#ffffff33", color:"#fff" }}>
                RSVP: {RSVP_CFG[myRsvp]?.label}
              </span>
              {m.link && (
                <button onClick={() => setNexMeet({roomCode:m.link, userName:user.name})}
                  style={{ background:"#00d4ff22", color:"#00d4ff", border:"1px solid #00d4ff55", padding:"5px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  🎥 Join Call
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", padding:"0 20px", flexShrink:0 }}>
          {[
            { id:"agenda",    label:"Agenda" },
            { id:"attendees", label:"Attendees" },
            { id:"minutes",   label:"Minutes", badge: m.minutes ? "✓" : null },
            { id:"actions",   label:"Actions",  badge: actions.length > 0 ? (doneCount + "/" + actions.length) : null },
          ].map(t => (
            <button key={t.id} className={"tab-btn" + (activeTab===t.id ? " on" : "")} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.badge && (
                <span style={{ marginLeft:5, background: activeTab===t.id?"#dbeafe":"#f1f5f9", color: activeTab===t.id?"#2563eb":"#64748b", fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:700 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* AGENDA */}
          {activeTab === "agenda" && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>Agenda</div>
              <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:18, fontSize:14, color:"#334155", lineHeight:1.9, whiteSpace:"pre-wrap", minHeight:80 }}>
                {m.agenda || <span style={{ color:"#94a3b8" }}>No agenda set.</span>}
              </div>
              <div style={{ marginTop:22 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>Host</div>
                <div style={{ display:"flex", gap:12, alignItems:"center", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 16px" }}>
                  <div className="av" style={{ width:40, height:40, background:"#1e3a8a", fontSize:14, borderRadius:10 }}>{host?.avatar}</div>
                  <div>
                    <div style={{ fontWeight:700 }}>{host?.name}</div>
                    <div style={{ color:"#94a3b8", fontSize:12 }}>{host?.dept} · {host?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDEES */}
          {activeTab === "attendees" && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>
                Attendees ({m.attendees?.length ?? 0})
              </div>
              {(m.attendees ?? []).map(id => {
                const a  = accounts.find(x => x.id === id);
                const rv = m.rsvp?.[id] ?? "pending";
                const rc = RSVP_CFG[rv] ?? RSVP_CFG.pending;
                return (
                  <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <div className="av" style={{ width:36, height:36, background:"#1e3a8a", fontSize:12, borderRadius:9 }}>{a?.avatar ?? "?"}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>
                          {a?.name ?? "Unknown"}
                          {id === m.hostId && (
                            <span style={{ background:"#dbeafe", color:"#2563eb", fontSize:10, padding:"1px 7px", borderRadius:20, fontWeight:700, marginLeft:6 }}>Host</span>
                          )}
                        </div>
                        <div style={{ color:"#94a3b8", fontSize:12 }}>{a?.dept}</div>
                      </div>
                    </div>
                    <span className="chip" style={{ background:rc.bg, color:rc.color }}>{rc.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MINUTES — view saved, then edit separately */}
          {activeTab === "minutes" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em" }}>Meeting Minutes</div>
                {!editMinutes && (
                  <button className="btn" onClick={openEditMinutes}
                    style={{ background:"#eff6ff", color:"#1e3a8a", padding:"7px 16px", fontSize:12 }}>
                    ✏️ {m.minutes ? "Edit" : "Write Minutes"}
                  </button>
                )}
              </div>

              {/* View mode */}
              {!editMinutes && (
                m.minutes ? (
                  <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:20, fontSize:14, color:"#334155", lineHeight:1.9, whiteSpace:"pre-wrap", minHeight:120 }}>
                    {m.minutes}
                  </div>
                ) : (
                  <div style={{ background:"#f8fafc", border:"2px dashed #e2e8f0", borderRadius:12, padding:36, textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>📝</div>
                    <div style={{ color:"#94a3b8", fontWeight:600, fontSize:14 }}>No minutes saved yet</div>
                    <div style={{ color:"#cbd5e1", fontSize:13, marginTop:4 }}>Click "Write Minutes" to start</div>
                  </div>
                )
              )}

              {/* Edit mode */}
              {editMinutes && (
                <div>
                  <textarea
                    className="inp"
                    rows={12}
                    autoFocus
                    placeholder="Type meeting minutes, key decisions, notes..."
                    value={minutesDraft}
                    onChange={e => setMinutesDraft(e.target.value)}
                    style={{ resize:"vertical", lineHeight:1.8 }}
                  />
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button className="btn" onClick={() => setEditMinutes(false)}
                      style={{ background:"#f1f5f9", color:"#64748b", padding:"11px 0", flex:1 }}>
                      Cancel
                    </button>
                    <button className="btn" onClick={saveMinutes}
                      style={{ background:"#1e3a8a", color:"#fff", padding:"11px 0", flex:2 }}>
                      💾 Save Minutes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS */}
          {activeTab === "actions" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em" }}>Action Items</div>
                {actions.length > 0 && (
                  <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>{doneCount} of {actions.length} done</span>
                )}
              </div>

              {/* Empty state */}
              {actions.length === 0 && (
                <div style={{ background:"#f8fafc", border:"2px dashed #e2e8f0", borderRadius:12, padding:32, textAlign:"center", marginBottom:20 }}>
                  <div style={{ fontSize:30, marginBottom:8 }}>☑️</div>
                  <div style={{ color:"#94a3b8", fontWeight:600, fontSize:14 }}>No action items yet</div>
                  <div style={{ color:"#cbd5e1", fontSize:13, marginTop:4 }}>Add one using the form below</div>
                </div>
              )}

              {/* Action list — reads live actions from m (derived from state) */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                {actions.map((a, i) => {
                  const u = accounts.find(x => x.id === a.assignedTo);
                  const overdue = a.due && a.due < todayStr && !a.done;
                  return (
                    <div key={i} style={{ display:"flex", gap:12, padding:"14px 14px", borderRadius:10, background: a.done ? "#f8fafc" : "#fff", border:"1px solid #e2e8f0" }}>
                      <input
                        type="checkbox"
                        checked={!!a.done}
                        onChange={() => toggleAction(i)}
                        style={{ marginTop:2, cursor:"pointer", width:17, height:17, accentColor:"#1e3a8a", flexShrink:0 }}
                      />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14, textDecoration: a.done ? "line-through" : "none", color: a.done ? "#94a3b8" : "#0f172a" }}>
                          {a.text}
                        </div>
                        <div style={{ display:"flex", gap:12, marginTop:5, flexWrap:"wrap" }}>
                          <span style={{ color:"#64748b", fontSize:12 }}>→ {u?.name ?? "Unknown"}</span>
                          {a.due && (
                            <span style={{ fontSize:12, fontWeight: overdue ? 700 : 400, color: overdue ? "#dc2626" : "#94a3b8" }}>
                              📅 {fmtDate(a.due)}{overdue ? " ⚠️ Overdue" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      {a.done && <span style={{ fontSize:18, flexShrink:0 }}>✅</span>}
                    </div>
                  );
                })}
              </div>

              {/* Add action form */}
              <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:18 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", marginBottom:14 }}>➕ Add Action Item</div>
                <input
                  className="inp"
                  placeholder="What needs to be done?"
                  value={newAction.text}
                  onChange={e => setNewAction(prev => ({ ...prev, text: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addAction()}
                  style={{ marginBottom:10 }}
                />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:"#94a3b8", display:"block", marginBottom:5, textTransform:"uppercase" }}>Assign To</label>
                    <select
                      className="inp"
                      value={newAction.assignedTo}
                      onChange={e => setNewAction(prev => ({ ...prev, assignedTo: e.target.value }))}>
                      <option value="">Select person...</option>
                      {(m.attendees ?? []).map(id => {
                        const a = accounts.find(x => x.id === id);
                        return <option key={id} value={id}>{a?.name ?? ("User " + id)}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:"#94a3b8", display:"block", marginBottom:5, textTransform:"uppercase" }}>Due Date</label>
                    <input
                      type="date"
                      className="inp"
                      value={newAction.due}
                      onChange={e => setNewAction(prev => ({ ...prev, due: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="btn" onClick={addAction}
                  style={{ background:"#1e3a8a", color:"#fff", padding:"12px 0", fontSize:14, width:"100%" }}>
                  + Add Action Item
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
// ─── NEXMEET MODAL ────────────────────────────────────────────────────────────
function NexMeetModal({ code, userName, onClose }) {
  const [screen,    setScreen]    = useState("lobby"); // lobby | meeting
  const [isGuest,   setIsGuest]   = useState(false);
  const [myName,    setMyName]    = useState(userName || "");
  const [joinCode,  setJoinCode]  = useState(code || "");
  const [hostCode] = useState(code || genNexCode());
  const [lobbyTab,  setLobbyTab]  = useState("join"); // join | create
  const [status,    setStatus]    = useState({ text:"Enter your name to get started", type:"gray" });
  const [peerName,  setPeerName]  = useState("");
  const [connected, setConnected] = useState(false);
  const [micOn,     setMicOn]     = useState(true);
  const [camOn,     setCamOn]     = useState(true);
  const [chatMsgs,  setChatMsgs]  = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sideTab,   setSideTab]   = useState("chat");
  const [timer,     setTimer]     = useState("00:00");
  const [recOn,     setRecOn]     = useState(false);
  const [recTime,   setRecTime]   = useState("00:00");
  const [handUp,    setHandUp]    = useState(false);
  const [pjsReady,  setPjsReady]  = useState(false);
  const [toast,     setToast]     = useState("");
  const [reactions, setReactions] = useState([]);
  const [rtrayOpen, setRtrayOpen] = useState(false);

  const peerRef      = useRef(null);
  const connRef      = useRef(null);
  const callRef      = useRef(null);
  const localRef     = useRef(null);
  const remoteRef    = useRef(null);
  const streamRef    = useRef(null);
  const screenRef    = useRef(null);
  const recorderRef  = useRef(null);
  const recChunksRef = useRef([]);
  const timerRef     = useRef(null);
  const recTimerRef  = useRef(null);
  const meetStartRef = useRef(0);
  const recSecsRef   = useRef(0);

  // Load PeerJS once
  useEffect(() => {
    if (window.Peer) { setPjsReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
    s.onload = () => setPjsReady(true);
    document.head.appendChild(s);
    return () => { cleanup(); };
  }, []);

  // NexMeet styles injected once
  useEffect(() => {
    const id = "nexmeet-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
      .nm-root{font-family:'DM Sans',sans-serif;background:#07090f;color:#dde6f0}
      .nm-vtile{position:relative;background:#151d2b;border:1.5px solid #1d2d3f;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:180px}
      .nm-vtile.speaking{border-color:#00d4ff;box-shadow:0 0 18px rgba(0,212,255,.22)}
      .nm-vtile video{width:100%;height:100%;object-fit:cover;display:block}
      .nm-vtile video.nm-mirror{transform:scaleX(-1)}
      .nm-av{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:22px;font-weight:800}
      .nm-vtag{position:absolute;bottom:8px;left:8px;background:rgba(7,9,15,.82);border:1px solid #1d2d3f;border-radius:7px;padding:3px 9px;font-size:12px;display:flex;align-items:center;gap:5px}
      .nm-ctrl{width:44px;height:44px;border-radius:11px;border:1px solid #1d2d3f;background:#151d2b;color:#dde6f0;font-size:19px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0}
      .nm-ctrl:hover{background:#1b2537;border-color:#00d4ff;color:#00d4ff}
      .nm-ctrl.off{background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.3);color:#ef4444}
      .nm-ctrl.hi{background:rgba(0,212,255,.1);border-color:rgba(0,212,255,.3);color:#00d4ff}
      .nm-endbtn{padding:0 18px;height:44px;border-radius:11px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.13);color:#ef4444;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
      .nm-endbtn:hover{background:rgba(239,68,68,.25)}
      .nm-inp{width:100%;background:#151d2b;border:1px solid #1d2d3f;border-radius:9px;padding:10px 13px;color:#dde6f0;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;margin-bottom:12px}
      .nm-inp:focus{border-color:#00d4ff}
      .nm-inp::placeholder{color:#4d6070}
      .nm-btn{width:100%;padding:12px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;background:#00d4ff;color:#000;transition:all .2s}
      .nm-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 0 24px rgba(0,212,255,.4)}
      .nm-btn:disabled{opacity:.45;cursor:not-allowed}
      .nm-cmsg{padding:7px 10px;border-radius:8px;margin-bottom:5px;font-size:13px}
      .nm-cmsg.me{background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.14);margin-left:14px}
      .nm-cmsg.them{background:#151d2b;border:1px solid #1d2d3f;margin-right:14px}
      .nm-cmsg .who{font-size:10px;font-weight:600;color:#00d4ff;margin-bottom:1px}
      .nm-cmsg .when{font-size:10px;color:#4d6070;text-align:right;margin-top:1px}
      .nm-freact{position:absolute;font-size:30px;pointer-events:none;z-index:50;animation:nm-floatup 2.4s ease-out forwards}
      @keyframes nm-floatup{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:.8;transform:translateY(-60px) scale(1.3)}100%{opacity:0;transform:translateY(-110px) scale(.7)}}
      .nm-spinner{width:40px;height:40px;border-radius:50%;border:3px solid #1d2d3f;border-top-color:#00d4ff;animation:nm-spin 1s linear infinite}
      @keyframes nm-spin{to{transform:rotate(360deg)}}
      .nm-stab{flex:1;padding:10px 0;border:none;background:none;color:#4d6070;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;transition:all .18s}
      .nm-stab.on{color:#dde6f0;border-bottom-color:#00d4ff}
    `;
    document.head.appendChild(style);
  }, []);

  const showToastNM = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const setStatusNM = (text, type = "gray") => setStatus({ text, type });

  const cleanup = () => {
    callRef.current?.close();
    connRef.current?.close();
    peerRef.current?.destroy();
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    clearInterval(recTimerRef.current);
    peerRef.current = connRef.current = callRef.current = streamRef.current = screenRef.current = null;
  };

  const getMedia = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      if (localRef.current) localRef.current.srcObject = s;
      setStatusNM("Camera & mic ready", "green"); return true;
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        streamRef.current = s;
        if (localRef.current) localRef.current.srcObject = s;
        setCamOn(false); setStatusNM("Audio only", "amber");
        showToastNM("⚠️ No camera — audio only"); return true;
      } catch {
        setStatusNM("Media access denied"); showToastNM("❌ Allow camera/mic and reload"); return false;
      }
    }
  };

  const startTimer = () => {
    meetStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - meetStartRef.current) / 1000);
      setTimer(`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`);
    }, 1000);
  };

  const onPeerStream = (remoteStream, pName) => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
    setConnected(true);
    showToastNM(`🟢 ${pName || "Peer"} connected!`);
  };

  const onPeerLeft = () => {
    setConnected(false);
    if (remoteRef.current) remoteRef.current.srcObject = null;
    showToastNM("⚠️ Peer left the meeting");
  };

  const onData = (raw) => {
    try {
      const m = JSON.parse(raw);
      if (m.t === "name") {
        setPeerName(m.n);
      }
      if (m.t === "chat") {
        setChatMsgs(p => [...p, { who: m.senderName || "Peer", txt: m.txt, me: false, time: new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }) }]);
      }
      if (m.t === "react") {
        const id = Date.now();
        setReactions(p => [...p, { id, emoji: m.e, side: "remote" }]);
        setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2600);
      }
      if (m.t === "hand") showToastNM((m.n || "Peer") + (m.up ? " ✋ raised hand" : " lowered hand"));
    } catch {}
  };

  const tx = (obj) => {
    if (connRef.current?.open) connRef.current.send(JSON.stringify(obj));
  };

  const setupDataConn = (dc) => {
    connRef.current = dc;
    dc.on("open", () => dc.send(JSON.stringify({ t: "name", n: myName })));
    dc.on("data", onData);
    dc.on("close", onPeerLeft);
  };

  const doCreate = async () => {
    if (!myName.trim()) { showToastNM("Enter your name first"); return; }
    setStatusNM("Requesting camera & mic…", "amber");
    const ok = await getMedia(); if (!ok) return;
    setStatusNM("Starting meeting…", "amber");
    const P = window.Peer;
    const peer = new P(hostCode, { debug: 1 });
    peerRef.current = peer;
    peer.on("error", e => {
      if (e.type === "unavailable-id") showToastNM("⚠️ Code in use — try joining instead");
      else showToastNM("Error: " + e.type);
      setStatusNM("Error", "gray");
    });
    peer.on("open", () => {
      setStatusNM("Meeting ready — share the code!", "green");
      setScreen("meeting");
      startTimer();
      peer.on("call", incoming => {
        callRef.current = incoming;
        incoming.answer(streamRef.current);
        incoming.on("stream", rs => onPeerStream(rs, peerRef._peerName));
        incoming.on("close", onPeerLeft);
      });
      peer.on("connection", dc => {
        setupDataConn(dc);
        dc.on("open", () => {
          dc.send(JSON.stringify({ t: "name", n: myName }));
        });
        dc.on("data", raw => {
          const m = JSON.parse(raw);
          if (m.t === "name") { setPeerName(m.n); peerRef._peerName = m.n; }
          else onData(raw);
        });
      });
    });
  };

  const doJoin = async () => {
    if (!myName.trim()) { showToastNM("Enter your name"); return; }
    if (joinCode.trim().length < 4) { showToastNM("Enter the full meeting code"); return; }
    setStatusNM("Requesting camera & mic…", "amber");
    const ok = await getMedia(); if (!ok) return;
    setStatusNM("Connecting to host…", "amber");
    const P = window.Peer;
    const peer = new P(undefined, { debug: 1 });
    peerRef.current = peer;
    peer.on("error", e => { showToastNM("Could not connect: " + e.type); setStatusNM("Connection failed", "gray"); });
    peer.on("open", () => {
      setScreen("meeting"); setIsGuest(true); startTimer();
      const dc = peer.connect(joinCode.trim().toUpperCase(), { reliable: true });
      connRef.current = dc;
      dc.on("open", () => {
        dc.send(JSON.stringify({ t: "name", n: myName }));
        const c = peer.call(joinCode.trim().toUpperCase(), streamRef.current);
        callRef.current = c;
        c.on("stream", rs => onPeerStream(rs, "Host"));
        c.on("close", onPeerLeft);
      });
      dc.on("data", raw => {
        const m = JSON.parse(raw);
        if (m.t === "name") setPeerName(m.n);
        else onData(raw);
      });
      dc.on("close", onPeerLeft);
      setStatusNM("Waiting for host…", "amber");
    });
  };

  const endCall = () => {
    cleanup();
    setScreen("lobby"); setConnected(false); setPeerName(""); setTimer("00:00");
    setMicOn(true); setCamOn(true); setHandUp(false); setRecOn(false); setRecTime("00:00");
    setChatMsgs([]); setIsGuest(false);
    showToastNM("👋 You left the meeting");
  };

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach(t => t.enabled = next);
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach(t => t.enabled = next);
    setCamOn(next);
  };

  const toggleScreen = async () => {
    if (screenRef.current) {
      screenRef.current.getTracks().forEach(t => t.stop());
      screenRef.current = null;
      const vt = streamRef.current?.getVideoTracks()[0];
      if (callRef.current && vt) {
        const s = callRef.current.peerConnection?.getSenders().find(s => s.track?.kind === "video");
        if (s) s.replaceTrack(vt);
      }
      if (localRef.current) localRef.current.srcObject = streamRef.current;
      showToastNM("🖥️ Screen share stopped"); return;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenRef.current = ss;
      const st = ss.getVideoTracks()[0];
      if (callRef.current) {
        const s = callRef.current.peerConnection?.getSenders().find(s => s.track?.kind === "video");
        if (s) s.replaceTrack(st);
      }
      if (localRef.current) localRef.current.srcObject = ss;
      st.onended = toggleScreen;
      showToastNM("🖥️ Screen sharing");
    } catch { showToastNM("Screen share cancelled"); }
  };

  const toggleRec = () => {
    if (!recOn) {
      try { recorderRef.current = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9,opus" }); }
      catch { recorderRef.current = new MediaRecorder(streamRef.current); }
      recChunksRef.current = [];
      recorderRef.current.ondataavailable = e => recChunksRef.current.push(e.data);
      recorderRef.current.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: "video/webm" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `nexmeet-${hostCode || joinCode}.webm`; a.click();
        showToastNM("⬇️ Recording saved!");
      };
      recorderRef.current.start(1000); setRecOn(true);
      recSecsRef.current = 0;
      recTimerRef.current = setInterval(() => {
        recSecsRef.current++;
        const s = recSecsRef.current;
        setRecTime(`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`);
      }, 1000);
      showToastNM("⏺️ Recording started");
    } else {
      recorderRef.current?.stop(); setRecOn(false);
      clearInterval(recTimerRef.current); setRecTime("00:00");
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = { who: "You", txt: chatInput.trim(), me: true, time: new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }) };
    setChatMsgs(p => [...p, msg]);
    tx({ t: "chat", txt: chatInput.trim(), senderName: myName });
    setChatInput("");
  };

  const sendReact = (emoji) => {
    const id = Date.now();
    setReactions(p => [...p, { id, emoji, side: "local" }]);
    setTimeout(() => setReactions(p => p.filter(r => r.id !== id)), 2600);
    tx({ t: "react", e: emoji });
    setRtrayOpen(false);
  };

  const toggleHand = () => {
    const next = !handUp;
    setHandUp(next);
    tx({ t: "hand", n: myName, up: next });
    showToastNM(next ? "✋ Hand raised" : "Hand lowered");
  };

  const dotColor = status.type === "green" ? "#22c55e" : status.type === "amber" ? "#f59e0b" : "#4d6070";

  // ── LOBBY SCREEN ──
  if (screen === "lobby") return (
    <div className="nm-root" style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#07090f" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      {/* Ambient orbs */}
      <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", filter:"blur(110px)", background:"radial-gradient(circle,rgba(0,212,255,.07),transparent 70%)", top:-180, right:-120, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:380, height:380, borderRadius:"50%", filter:"blur(110px)", background:"radial-gradient(circle,rgba(124,58,237,.06),transparent 70%)", bottom:-80, left:-80, pointerEvents:"none" }} />

      {/* Close button top right */}
      <div style={{ position:"absolute", top:16, right:16, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)", color:"#ef4444", borderRadius:9, padding:"7px 16px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>✕ Close</button>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:1 }}>
        <div style={{ width:"100%", maxWidth:420, background:"#0e1420", border:"1px solid #1d2d3f", borderRadius:22, padding:36, boxShadow:"0 32px 80px rgba(0,0,0,.55)", position:"relative" }}>
          {/* Card shine border */}
          <div style={{ position:"absolute", inset:0, borderRadius:22, padding:1, background:"linear-gradient(135deg,rgba(0,212,255,.25),transparent 50%,rgba(124,58,237,.15))", WebkitMask:"linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)", WebkitMaskComposite:"xor", maskComposite:"exclude", pointerEvents:"none" }} />

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:26 }}>
            <div style={{ width:42, height:42, borderRadius:13, background:"linear-gradient(135deg,#00d4ff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>⚡</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, letterSpacing:"-.4px", color:"#dde6f0" }}>NexMeet</div>
              <div style={{ fontSize:11, color:"#4d6070", marginTop:1 }}>Real P2P · WebRTC · No servers</div>
            </div>
            <span style={{ marginLeft:"auto", background:"rgba(0,212,255,.09)", color:"#00d4ff", border:"1px solid rgba(0,212,255,.2)", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:500 }}>LIVE</span>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:3, background:"#151d2b", padding:4, borderRadius:10, marginBottom:22 }}>
            {[["join","Join Meeting"],["create","New Meeting"]].map(([k,v]) => (
              <button key={k} onClick={() => setLobbyTab(k)}
                style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:lobbyTab===k?"#1b2537":"none", color:lobbyTab===k?"#dde6f0":"#4d6070", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .18s" }}>
                {v}
              </button>
            ))}
          </div>

          {/* JOIN tab */}
          {lobbyTab === "join" && (
            <div>
              <div style={{ fontSize:11, color:"#4d6070", marginBottom:5, letterSpacing:".04em" }}>YOUR NAME</div>
              <input className="nm-inp" placeholder="Display name" value={myName} onChange={e => setMyName(e.target.value)} onKeyDown={e => e.key==="Enter" && doJoin()} />
              <div style={{ fontSize:11, color:"#4d6070", marginBottom:5, letterSpacing:".04em" }}>MEETING CODE</div>
              <input className="nm-inp" placeholder="XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} onKeyDown={e => e.key==="Enter" && doJoin()}
                style={{ letterSpacing:5, fontFamily:"'Syne',sans-serif", fontSize:20, textTransform:"uppercase", textAlign:"center" }} />
              <button className="nm-btn" onClick={doJoin} disabled={!pjsReady}>
                {pjsReady ? "🚀 Join Meeting" : "Loading…"}
              </button>
            </div>
          )}

          {/* CREATE tab */}
          {lobbyTab === "create" && (
            <div>
              <div style={{ fontSize:11, color:"#4d6070", marginBottom:5, letterSpacing:".04em" }}>YOUR NAME</div>
              <input className="nm-inp" placeholder="Display name" value={myName} onChange={e => setMyName(e.target.value)} />
              <div style={{ fontSize:11, color:"#4d6070", marginBottom:5, letterSpacing:".04em" }}>SHARE THIS CODE</div>
              <div onClick={() => { navigator.clipboard.writeText(hostCode).then(()=>showToastNM("📋 Copied!")); }}
                style={{ background:"#151d2b", border:"1px solid rgba(0,212,255,.25)", borderRadius:11, padding:14, textAlign:"center", marginBottom:13, cursor:"pointer" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, letterSpacing:8, color:"#00d4ff", textShadow:"0 0 16px rgba(0,212,255,.35)" }}>{hostCode}</div>
                <div style={{ fontSize:11, color:"#4d6070", marginTop:4 }}>Click to copy · Share with your guest</div>
              </div>
              <button className="nm-btn" onClick={doCreate} disabled={!pjsReady}>
                {pjsReady ? "⚡ Start Meeting" : "Loading…"}
              </button>
            </div>
          )}

          {/* Status */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 13px", background:"#151d2b", border:"1px solid #1d2d3f", borderRadius:9, fontSize:13, color:"#4d6070", marginTop:11 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:dotColor, flexShrink:0 }} />
            {status.text}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#1b2537", border:"1px solid #1d2d3f", borderRadius:9, padding:"9px 18px", fontSize:13, color:"#dde6f0", zIndex:9999, whiteSpace:"nowrap" }}>{toast}</div>}
    </div>
  );

  // ── MEETING SCREEN ──
  return (
    <div className="nm-root" style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", background:"#07090f" }}>
      {/* Header */}
      <div style={{ height:52, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", borderBottom:"1px solid #1d2d3f", background:"rgba(14,20,32,.9)", backdropFilter:"blur(14px)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#dde6f0" }}>⚡ NexMeet</span>
          <span style={{ width:1, height:18, background:"#1d2d3f" }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, letterSpacing:3, color:"#00d4ff" }}>{isGuest ? joinCode : hostCode}</span>
          {recOn && <span style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:18, fontSize:12, color:"#ef4444" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444" }} /> REC {recTime}
          </span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {connected
            ? <span style={{ background:"rgba(34,197,94,.1)", color:"#22c55e", border:"1px solid rgba(34,197,94,.25)", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:500 }}>● Connected</span>
            : <span style={{ background:"rgba(245,158,11,.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,.25)", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:500 }}>Waiting for peer…</span>}
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"#4d6070" }}>{timer}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        {/* Video area */}
        <div style={{ flex:1, padding:12, display:"flex", flexDirection:"column", gap:10, overflow:"hidden", position:"relative" }}>
          {!connected && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, background:"#07090f", zIndex:5 }}>
              <div className="nm-spinner" />
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:"#dde6f0" }}>{isGuest ? "Connecting to host…" : "Waiting for your guest…"}</div>
              <div style={{ color:"#4d6070", fontSize:13, textAlign:"center", maxWidth:280 }}>Share the code. Call connects automatically once peer joins.</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, letterSpacing:9, color:"#00d4ff", textShadow:"0 0 20px rgba(0,212,255,.4)" }}>{isGuest ? joinCode : hostCode}</div>
            </div>
          )}

          <div style={{ flex:1, display:"grid", gridTemplateColumns:connected?"1fr 1fr":"1fr", gap:10, minHeight:0 }}>
            {/* Local tile */}
            <div className="nm-vtile" style={{ position:"relative" }}>
              <video ref={localRef} autoPlay muted playsInline className="nm-mirror" style={{ width:"100%", height:"100%", objectFit:"cover", display:camOn?"block":"none" }} />
              {!camOn && <div className="nm-av" style={{ color:"#00d4ff", background:"rgba(0,212,255,.08)", border:"2px solid rgba(0,212,255,.3)" }}>{myName.slice(0,2).toUpperCase()}</div>}
              <div className="nm-vtag">{myName || "You"} (You) {!micOn && <span style={{ fontSize:11 }}>🔇</span>}</div>
              {reactions.filter(r=>r.side==="local").map(r => (
                <div key={r.id} className="nm-freact" style={{ left:(25+Math.random()*50)+"%", bottom:50 }}>{r.emoji}</div>
              ))}
            </div>
            {/* Remote tile */}
            {connected && (
              <div className="nm-vtile" style={{ position:"relative" }}>
                <video ref={remoteRef} autoPlay playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <div className="nm-vtag">{peerName || "Peer"}</div>
                {reactions.filter(r=>r.side==="remote").map(r => (
                  <div key={r.id} className="nm-freact" style={{ left:(25+Math.random()*50)+"%", bottom:50 }}>{r.emoji}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width:270, display:"flex", flexDirection:"column", borderLeft:"1px solid #1d2d3f", background:"rgba(14,20,32,.7)" }}>
          <div style={{ display:"flex", borderBottom:"1px solid #1d2d3f" }}>
            {[["chat","💬 Chat"],["info","ℹ️ Info"]].map(([k,v]) => (
              <button key={k} className={"nm-stab"+(sideTab===k?" on":"")} onClick={() => setSideTab(k)}>{v}</button>
            ))}
          </div>

          {/* Chat */}
          {sideTab === "chat" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", padding:12, minHeight:0 }}>
              <div style={{ flex:1, overflowY:"auto", marginBottom:10 }}>
                {chatMsgs.length === 0 && <div style={{ color:"#4d6070", fontSize:12, textAlign:"center", marginTop:24 }}>No messages yet</div>}
                {chatMsgs.map((m,i) => (
                  <div key={i} className={"nm-cmsg "+(m.me?"me":"them")}>
                    <div className="who">{m.who}</div>
                    <div style={{ fontSize:13 }}>{m.txt}</div>
                    <div className="when">{m.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                <input style={{ flex:1, background:"#151d2b", border:"1px solid #1d2d3f", borderRadius:9, padding:"9px 12px", color:"#dde6f0", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}
                  placeholder="Message…" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} />
                <button onClick={sendChat} style={{ width:36, height:36, borderRadius:9, border:"none", background:"#00d4ff", color:"#000", cursor:"pointer", fontSize:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>➤</button>
              </div>
            </div>
          )}

          {/* Info */}
          {sideTab === "info" && (
            <div style={{ padding:12 }}>
              {[["Room Code", isGuest ? joinCode : hostCode, "#00d4ff"],["Your Name", myName, null],["Peer", peerName || "Waiting…", null],["Status", connected?"Connected":"Waiting…", connected?"#22c55e":"#f59e0b"],["Encryption","🔒 DTLS-SRTP","#22c55e"]].map(([l,v,c]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 11px", background:"#151d2b", border:"1px solid #1d2d3f", borderRadius:9, marginBottom:7, fontSize:13 }}>
                  <span style={{ fontSize:11, color:"#4d6070" }}>{l}</span>
                  <span style={{ fontFamily: l==="Room Code"?"'Syne',sans-serif":"inherit", letterSpacing: l==="Room Code"?3:0, color:c||"#dde6f0" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div style={{ height:68, display:"flex", alignItems:"center", justifyContent:"center", gap:7, borderTop:"1px solid #1d2d3f", background:"rgba(14,20,32,.95)", backdropFilter:"blur(12px)", flexShrink:0, position:"relative", padding:"0 18px" }}>
        {/* Reaction tray */}
        {rtrayOpen && (
          <div style={{ position:"absolute", bottom:72, left:"50%", transform:"translateX(-50%)", background:"#151d2b", border:"1px solid #1d2d3f", borderRadius:14, padding:"7px 10px", display:"flex", gap:5, zIndex:20 }}>
            {["👍","❤️","😂","🔥","👏","😮"].map(e => (
              <button key={e} onClick={() => sendReact(e)} style={{ width:38, height:38, borderRadius:9, border:"none", background:"#1b2537", fontSize:19, cursor:"pointer" }}>{e}</button>
            ))}
          </div>
        )}

        <div style={{ position:"absolute", left:16 }}>
          <button className={"nm-ctrl"+(recOn?" hi":"")} onClick={toggleRec} title="Record">⏺</button>
        </div>

        <button className={"nm-ctrl"+(micOn?"":" off")} onClick={toggleMic} title={micOn?"Mute":"Unmute"}>{micOn?"🎙️":"🔇"}</button>
        <button className={"nm-ctrl"+(camOn?"":" off")} onClick={toggleCam} title={camOn?"Stop Cam":"Start Cam"}>{camOn?"📷":"🚫"}</button>
        <button className="nm-ctrl" onClick={toggleScreen} title="Share Screen">🖥️</button>
        <button className={"nm-ctrl"+(handUp?" hi":"")} onClick={toggleHand} title="Raise Hand">✋</button>
        <button className={"nm-ctrl"+(rtrayOpen?" hi":"")} onClick={() => setRtrayOpen(p=>!p)} title="Reactions">😊</button>
        <button className="nm-endbtn" onClick={endCall}>📵 Leave</button>

        <div style={{ position:"absolute", right:16 }}>
          <button className="nm-ctrl" onClick={onClose} title="Close MeetSpace">✕</button>
        </div>
      </div>

      {toast && <div style={{ position:"fixed", bottom:82, left:"50%", transform:"translateX(-50%)", background:"#1b2537", border:"1px solid #1d2d3f", borderRadius:9, padding:"9px 18px", fontSize:13, color:"#dde6f0", zIndex:9999, whiteSpace:"nowrap" }}>{toast}</div>}
    </div>
  );
}
