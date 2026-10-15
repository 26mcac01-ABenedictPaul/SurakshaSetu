<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="true" %>
<%!
    /** Minimal HTML escaping for values taken from the session. */
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
%>
<%
    // Server-side access control: this page is never sent to anyone who is not a logged-in citizen.
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setDateHeader("Expires", 0);

    HttpSession userSession = request.getSession(false);
    String role = userSession == null ? null : (String) userSession.getAttribute("role");
    if (role == null) {
        response.sendRedirect(request.getContextPath() + "/index.html");
        return;
    }
    if (!"user".equals(role)) {                       // officers/admins go to their own dashboards
        response.sendRedirect(request.getContextPath() + "/" + role + ".html");
        return;
    }
    String loggedInName = esc((String) userSession.getAttribute("name"));
%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SurakshaSetu — Citizen Home</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="app.css">
<link rel="stylesheet" href="sections.css">
<link rel="stylesheet" href="header-ai.css">
<style>
  h1,h2.big,.svc b,.hello h1{font-family:'Archivo Black','Inter',sans-serif}
  .hello{position:relative;overflow:hidden;border-radius:16px;padding:32px 28px;border:1px solid var(--line);
    background:radial-gradient(circle at 90% 10%,rgba(58,134,255,.28),transparent 45%),radial-gradient(circle at 5% 100%,rgba(229,83,75,.22),transparent 45%),var(--panel)}
  .hello h1{font-size:clamp(1.5rem,4vw,2.3rem);line-height:1.1}
  .hello h1 em{font-style:normal;color:var(--amber)}
  .hello p{color:var(--muted);margin-top:10px;max-width:560px;line-height:1.55}
  .hello .quick{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .hello .shieldbg{position:absolute;right:-20px;top:-10px;width:180px;opacity:.12;animation:float 5s ease-in-out infinite}
  @keyframes float{50%{transform:translateY(10px) rotate(3deg)}}
  .sos{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
  .sos a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:10px;background:var(--steel);border:1px solid var(--line);text-decoration:none;color:var(--paper)}
  .sos a b{font-size:1.4rem;color:var(--amber);font-family:'Archivo Black',sans-serif}
  .sos a span{font-size:.78rem;color:var(--muted)}
  .sos a.red b{color:#ff9b95}
  .sechead{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  .seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
  .seg button{background:none;border:none;color:var(--muted);font:inherit;font-size:.8rem;padding:6px 12px;cursor:pointer}
  .seg button.on{background:var(--amber);color:#1a1200;font-weight:700}
  .news{display:grid;gap:10px}
  .item{display:block;text-decoration:none;color:var(--paper);background:var(--steel);border:1px solid var(--line);border-radius:10px;padding:13px 15px;transition:transform .15s,border-color .15s}
  a.item:hover{transform:translateY(-2px);border-color:var(--amber)}
  .item b{display:block;font-size:.94rem;line-height:1.4;font-weight:600}
  .item .m{margin-top:6px;font-size:.74rem;color:var(--muted);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .item .rg{font-weight:700;color:#8db8ff}
  .livedot{font-size:.7rem;color:var(--muted)}
  .services{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .svc{background:var(--steel);border:1px solid var(--line);border-radius:12px;padding:16px 14px;cursor:pointer;text-align:left;color:var(--paper);font:inherit;transition:transform .18s,border-color .18s,background .18s;position:relative;overflow:hidden}
  .svc:hover,.svc.on{transform:translateY(-3px);border-color:var(--amber);background:rgba(244,163,0,.07)}
  .svc .ic{font-size:1.7rem;display:block;margin-bottom:8px}
  .svc b{font-size:.88rem;display:block}
  .svc span{font-size:.74rem;color:var(--muted);line-height:1.35;display:block;margin-top:4px}
  .sev{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:12px;border-radius:10px;background:var(--ink);border:1px dashed var(--line);min-height:50px}
  .sev .why{font-size:.8rem;color:var(--muted)}
  .legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:6px}
  .legend div{font-size:.8rem;color:var(--muted);line-height:1.4}
  .check{display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:.84rem;color:var(--muted)}
  .check input{width:auto;margin-top:3px}
  .firbox{padding:14px;border-radius:10px;border:1px dashed rgba(244,163,0,.5);background:rgba(244,163,0,.06)}
  .firbox b.num{font-family:'Archivo Black',sans-serif;color:var(--amber)}

  /* ===== v3: creative home ===== */
  .reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
  .reveal.in{opacity:1;transform:none}
  .hello .orb{position:absolute;border-radius:50%;filter:blur(40px);opacity:.5;pointer-events:none;animation:orb 7s ease-in-out infinite alternate}
  .hello .orb.o1{width:180px;height:180px;background:#E5534B;left:-40px;bottom:-60px}
  .hello .orb.o2{width:200px;height:200px;background:#3A86FF;right:10%;top:-70px;animation-delay:2s}
  @keyframes orb{to{transform:translate(30px,-20px) scale(1.2)}}
  .hello h1 .l2{display:block;font-size:.55em;margin-top:6px;color:var(--paper);opacity:.9}
  .hello h1,.hello p,.hello .quick{position:relative;z-index:1}
  .hello .wave{display:inline-block;transform-origin:70% 70%;animation:wave 2.4s ease-in-out infinite}
  @keyframes wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(14deg)}20%,40%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}
  .btn.primary{position:relative;overflow:hidden}
  .btn.primary::after{content:"";position:absolute;top:0;left:-70%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:shine 3.5s ease-in-out infinite}
  @keyframes shine{0%,55%{left:-70%}100%{left:130%}}

  /* trust ticker */
  .ticker{overflow:hidden;border:1px solid var(--line);border-radius:10px;background:var(--panel);position:relative}
  .ticker::before,.ticker::after{content:"";position:absolute;top:0;bottom:0;width:50px;z-index:1;pointer-events:none}
  .ticker::before{left:0;background:linear-gradient(90deg,var(--panel),transparent)}
  .ticker::after{right:0;background:linear-gradient(-90deg,var(--panel),transparent)}
  .ticker .track{display:flex;width:max-content;animation:tick 38s linear infinite}
  .ticker:hover .track{animation-play-state:paused}
  .ticker span{padding:11px 26px;font-size:.84rem;color:var(--muted);white-space:nowrap}
  .ticker span b{color:var(--paper)}
  @keyframes tick{to{transform:translateX(-50%)}}

  /* promo carousel (our own service ads) */
  .promo{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line);min-height:210px}
  .slide{position:absolute;inset:0;display:flex;align-items:center;gap:20px;padding:26px 30px;opacity:0;visibility:hidden;transform:scale(1.04);transition:opacity .7s,transform .9s,visibility .7s}
  .slide.on{opacity:1;visibility:visible;transform:none}
  .slide .tx{flex:1;min-width:0;position:relative;z-index:1}
  .slide .kick{font-size:.68rem;font-weight:800;letter-spacing:.16em;opacity:.85}
  .slide h3{font-family:'Archivo Black',sans-serif;font-size:clamp(1.15rem,2.8vw,1.8rem);line-height:1.1;margin:8px 0}
  .slide p{font-size:.9rem;opacity:.9;max-width:460px;line-height:1.45}
  .slide .btn{margin-top:14px;background:#fff;color:#111;border-color:#fff;font-weight:700}
  .slide .art{font-size:clamp(4rem,12vw,7.5rem);filter:drop-shadow(0 12px 24px rgba(0,0,0,.4));animation:bob 3.4s ease-in-out infinite;position:relative;z-index:1}
  @keyframes bob{50%{transform:translateY(-12px) rotate(-4deg)}}
  .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:7px;z-index:3}
  .dots i{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.4);cursor:pointer;transition:.3s}
  .dots i.on{width:26px;background:#fff}
  .promo .adtag{position:absolute;top:10px;right:12px;z-index:3;font-size:.6rem;letter-spacing:.12em;font-weight:700;background:rgba(0,0,0,.35);padding:3px 8px;border-radius:99px}
  @media(max-width:560px){.slide{padding:20px 18px;gap:8px}.promo{min-height:240px}}

  /* reels */
  .rail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 12px;scrollbar-width:thin}
  .reelc{flex:0 0 150px;height:250px;border-radius:14px;scroll-snap-align:start;position:relative;overflow:hidden;cursor:pointer;border:1px solid var(--line);color:#fff;text-align:left;font:inherit;padding:0;transition:transform .25s}
  .reelc:hover{transform:translateY(-5px) scale(1.03)}
  .reelc .em{position:absolute;top:34%;left:50%;transform:translate(-50%,-50%);font-size:3.4rem;animation:bob 3s ease-in-out infinite}
  .reelc .cap{position:absolute;left:0;right:0;bottom:0;padding:34px 10px 10px;background:linear-gradient(transparent,rgba(0,0,0,.8));font-weight:700;font-size:.8rem;line-height:1.25}
  .reelc .play{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:.65rem}
  .reelc .ring{position:absolute;top:8px;left:8px;font-size:.58rem;font-weight:800;letter-spacing:.1em;background:#E5534B;padding:2px 6px;border-radius:4px}
  #reelV{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;backdrop-filter:blur(6px)}
  #reelV.on{display:flex;animation:fadeIn .25s}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .phone{position:relative;width:min(400px,94vw);height:min(720px,90vh);border-radius:22px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7);color:#fff}
  .phone .bars{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:4px;z-index:5}
  .phone .bars i{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden}
  .phone .bars i b{display:block;height:100%;width:0;background:#fff}
  .phone .bars i.done b{width:100%}
  .phone .bars i.run b{width:100%;transition:width linear}
  .phone .top{position:absolute;top:22px;left:14px;right:14px;display:flex;align-items:center;gap:10px;z-index:5;font-size:.82rem;font-weight:700}
  .phone .top .av{width:30px;height:30px;font-size:.7rem}
  .phone .top button{margin-left:auto;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer}
  .phone .stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:90px 30px 40px;gap:16px}
  .phone .stage .big{font-size:6rem;animation:pop2 .6s cubic-bezier(.2,1.4,.4,1) both}
  .phone .stage h3{font-family:'Archivo Black',sans-serif;font-size:1.6rem;line-height:1.15;animation:up .5s .1s both}
  .phone .stage p{font-size:1rem;line-height:1.5;opacity:.95;animation:up .5s .25s both}
  .phone .stage .btn{animation:up .5s .4s both;background:#fff;color:#111;font-weight:700;border-color:#fff}
  .phone video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
  .phone .stage.vid{justify-content:flex-end;padding:90px 30px 34px}
  .reelc .pst{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .reelc .play{z-index:2}.reelc .ring{z-index:2}
  .thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
  .thumb.hasimg::before,.thumb.hasimg .em{display:none}
  .thumb .rg{z-index:2}
  @keyframes pop2{from{opacity:0;transform:scale(.3) rotate(-20deg)}to{opacity:1;transform:none}}
  @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  .phone .zl,.phone .zr{position:absolute;top:70px;bottom:0;width:35%;z-index:4;cursor:pointer}
  .phone .zl{left:0}.phone .zr{right:0}
  .phone .stage .btn{position:relative;z-index:6}

  /* news with pictures */
  .nfeat{display:grid;grid-template-columns:1.3fr 1fr;gap:12px}
  .ncard{display:flex;flex-direction:column;background:var(--steel);border:1px solid var(--line);border-radius:12px;overflow:hidden;text-decoration:none;color:var(--paper);transition:transform .2s,border-color .2s}
  a.ncard:hover{transform:translateY(-3px);border-color:var(--amber)}
  .thumb{position:relative;height:130px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .thumb.big{height:230px}
  .thumb .em{font-size:3.2rem;filter:drop-shadow(0 6px 12px rgba(0,0,0,.4));animation:bob 4s ease-in-out infinite}
  .thumb.big .em{font-size:5rem}
  .thumb::before{content:"";position:absolute;inset:-40%;background:repeating-linear-gradient(135deg,transparent 0 18px,rgba(255,255,255,.06) 18px 36px);animation:slideBg 12s linear infinite}
  @keyframes slideBg{to{transform:translateX(50px)}}
  .thumb .rg{position:absolute;left:10px;top:10px;font-size:.62rem;font-weight:800;letter-spacing:.1em;background:rgba(0,0,0,.45);padding:3px 8px;border-radius:99px}
  .ncard .nb{padding:12px 14px;display:flex;flex-direction:column;gap:8px;flex:1}
  .ncard .nb b{font-size:.92rem;line-height:1.38;font-weight:600}
  .ncard .nm{font-size:.74rem;color:var(--muted)}
  .react{display:flex;gap:6px;margin-top:auto;padding-top:6px;border-top:1px solid var(--line)}
  .react button{flex:1;background:none;border:none;color:var(--muted);font:inherit;font-size:.78rem;padding:6px 4px;border-radius:6px;cursor:pointer;transition:.15s}
  .react button:hover{background:rgba(255,255,255,.06);color:var(--paper)}
  .react button.on{color:var(--amber);font-weight:700}
  .nrail{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:12px}
  @media(max-width:760px){.nfeat{grid-template-columns:1fr}}

  /* trust */
  .trust{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
  .tcard{background:var(--steel);border:1px solid var(--line);border-radius:12px;padding:18px;position:relative;overflow:hidden}
  .tcard .ti{font-size:1.6rem}
  .tcard b.n{display:block;font-family:'Archivo Black',sans-serif;font-size:1.9rem;color:var(--amber);margin:6px 0 2px}
  .tcard h4{font-size:.92rem;margin-bottom:4px}
  .tcard p{font-size:.8rem;color:var(--muted);line-height:1.45}
  .tcard::after{content:"";position:absolute;right:-30px;bottom:-30px;width:90px;height:90px;border-radius:50%;background:radial-gradient(var(--amber),transparent 70%);opacity:.12}

  /* live chat preview */
  .chatdemo{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}
  .chatdemo .mock{background:var(--ink);border:1px solid var(--line);border-radius:16px;padding:14px;min-height:230px;display:flex;flex-direction:column;gap:8px}
  .chatdemo .mock .mh{display:flex;gap:10px;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--line);font-size:.85rem}
  .chatdemo .mock .bub{font-size:.84rem}
  .typing{align-self:flex-start;background:var(--steel);padding:10px 14px;border-radius:14px;display:flex;gap:4px}
  .typing i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:dot 1s infinite}
  .typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
  @keyframes dot{50%{transform:translateY(-5px);opacity:.4}}
  .chatdemo h2{font-family:'Archivo Black',sans-serif;font-size:1.3rem}
  .chatdemo ul{list-style:none;margin:12px 0 16px;display:grid;gap:8px;font-size:.88rem;color:var(--muted)}
  @media(max-width:700px){.chatdemo{grid-template-columns:1fr}}

  /* floating SOS */
  .fabsos{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;align-items:center;gap:8px;background:#E5534B;color:#fff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:99px;box-shadow:0 8px 24px rgba(229,83,75,.5);animation:sosPulse 2s infinite}
  @keyframes sosPulse{0%{box-shadow:0 0 0 0 rgba(229,83,75,.6)}70%{box-shadow:0 0 0 18px rgba(229,83,75,0)}100%{box-shadow:0 0 0 0 rgba(229,83,75,0)}}
  @media (prefers-reduced-motion: reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.reveal{opacity:1;transform:none}}

  /* ===== file-a-case wizard ===== */
  .wiz{display:grid;gap:16px}
  .wizhead{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .wizhead h2{font-family:'Archivo Black','Inter',sans-serif;font-size:1.35rem;margin:0}
  .secbadge{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;color:#8fe3b3;border:1px solid rgba(61,190,122,.4);background:rgba(61,190,122,.08);padding:7px 13px;border-radius:99px;animation:badge 3s ease-in-out infinite}
  @keyframes badge{0%,100%{box-shadow:0 0 0 0 rgba(61,190,122,.35)}50%{box-shadow:0 0 0 8px rgba(61,190,122,0)}}
  .steps{list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .steps li{display:flex;align-items:center;gap:9px;font-size:.8rem;font-weight:600;color:var(--muted);padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--panel);transition:.3s}
  .steps li i{font-style:normal;flex:0 0 26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.76rem;font-weight:800;background:var(--steel);border:1px solid var(--line);transition:.35s}
  .steps li.on{color:var(--paper);border-color:var(--amber);background:rgba(244,163,0,.08)}
  .steps li.on i{background:var(--amber);color:#1a1200;border-color:var(--amber);transform:scale(1.1)}
  .steps li.done{color:#8fe3b3;border-color:rgba(61,190,122,.4);cursor:pointer}
  .steps li.done i{background:var(--green);color:#04210f;border-color:var(--green);font-size:0;animation:pop2 .45s cubic-bezier(.2,1.4,.4,1)}
  .steps li.done i::after{content:"\2713";font-size:.8rem}
  @media(max-width:620px){.steps li span{display:none}.steps li{justify-content:center}.steps li.on span{display:inline}.steps{grid-template-columns:1fr 1fr 1fr 2.4fr}}
  .wbar{height:4px;border-radius:99px;background:var(--steel);overflow:hidden;margin-top:-6px}
  .wbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--amber),var(--green));border-radius:99px;transition:width .6s cubic-bezier(.2,.8,.2,1)}
  .wizgrid{display:grid;grid-template-columns:1fr 270px;gap:16px;align-items:start}
  @media(max-width:860px){.wizgrid{grid-template-columns:1fr}.wizside{order:2}}
  .wizbody{min-width:0}
  .step{display:none}
  .step.on{display:block;animation:stepIn .45s cubic-bezier(.2,.8,.2,1) both}
  .step.back.on{animation-name:stepBack}
  @keyframes stepIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
  @keyframes stepBack{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:none}}
  .sh{font-size:1rem;margin:20px 0 4px;display:flex;align-items:center;gap:8px}
  .sh:first-child{margin-top:0}
  .sh::after{content:"";flex:1;height:1px;background:var(--line)}
  .opt{color:var(--muted);font-weight:400;opacity:.8}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  @media(max-width:700px){.grid3{grid-template-columns:1fr}}
  .wiz input,.wiz select,.wiz textarea{transition:border-color .2s,box-shadow .2s}
  .wiz input:focus,.wiz select:focus,.wiz textarea:focus{outline:none;border-color:var(--amber);box-shadow:0 0 0 3px rgba(244,163,0,.2)}
  .wiz .bad-f{border-color:var(--red)!important;animation:shake .35s}
  @keyframes shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
  .wiznav{display:flex;justify-content:space-between;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid var(--line)}
  .wiznav .btn{min-width:110px}
  #wBack[hidden]{display:block;visibility:hidden}

  .yn{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .yn button{text-align:left;background:var(--steel);border:2px solid var(--line);border-radius:12px;padding:14px;color:var(--paper);font:inherit;cursor:pointer;transition:.2s}
  .yn button b{display:block;font-size:1rem}.yn button span{font-size:.78rem;color:var(--muted)}
  .yn button:hover{transform:translateY(-2px);border-color:var(--amber)}
  .yn button.on{border-color:var(--amber);background:rgba(244,163,0,.1)}
  .callout{margin-top:12px;padding:11px 14px;border-radius:10px;font-size:.84rem;line-height:1.5;border-left:3px solid var(--amber);background:rgba(244,163,0,.07)}
  .finfields{display:none;margin-top:6px}.finfields.on{display:block;animation:stepIn .4s both}
  .nafin{display:none;margin-top:14px;padding:14px;border-radius:10px;border:1px dashed var(--line);color:var(--muted);font-size:.88rem;text-align:center}
  .nafin.on{display:block;animation:stepIn .4s both}

  .drop{margin-top:6px;border:2px dashed rgba(244,163,0,.5);border-radius:14px;padding:26px 16px;text-align:center;cursor:pointer;background:rgba(244,163,0,.04);transition:.2s;display:grid;gap:6px;justify-items:center}
  .drop span{font-size:.82rem;color:var(--muted)}
  .drop .dico{font-size:2.2rem;animation:bob 3s ease-in-out infinite}
  .drop:hover,.drop.over,.drop:focus-visible{background:rgba(244,163,0,.1);border-color:var(--amber);outline:none}
  .drop.over{transform:scale(1.015);box-shadow:0 0 0 6px rgba(244,163,0,.15)}
  .dbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
  .flist{display:grid;gap:8px;margin-top:14px}
  .fitem{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ink);border:1px solid var(--line);animation:stepIn .35s both;position:relative;overflow:hidden}
  .fitem .th{flex:0 0 46px;height:46px;border-radius:8px;background:var(--steel) center/cover;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
  .fitem .fi{flex:1;min-width:0}
  .fitem .fi b{display:block;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fitem .fi small{color:var(--muted);font-size:.74rem}
  .fst{font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:99px;border:1px solid var(--line);white-space:nowrap}
  .fst.checking{color:var(--muted)}
  .fst.ok{color:#8fe3b3;border-color:rgba(61,190,122,.45);background:rgba(61,190,122,.1)}
  .fst.bad{color:#ff9b95;border-color:rgba(229,83,75,.45);background:rgba(229,83,75,.1)}
  .fst.sent{color:#0b2a17;background:var(--green);border-color:var(--green)}
  .fitem.checking::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.07),transparent 70%);animation:sweep 1s linear infinite}
  @keyframes sweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
  .fitem .rm{background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:6px}
  .fitem .rm:hover{color:var(--red);background:rgba(229,83,75,.1)}
  .fitem .why{display:block;color:#ff9b95;font-size:.74rem;margin-top:2px}
  .fsum{margin-top:10px;font-size:.84rem;color:var(--muted)}
  .fsum b{color:var(--paper)}

  .rv{border:1px solid var(--line);border-radius:12px;background:var(--steel);margin-bottom:12px;overflow:hidden;animation:stepIn .4s both}
  .rv .rh{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,.04);font-weight:700;font-size:.88rem}
  .rv .rh button{background:none;border:none;color:var(--amber);font:inherit;font-size:.78rem;cursor:pointer}
  .rv .rb{padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 16px}
  .rv .rb div span{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .rv .rb div b{font-size:.88rem;font-weight:600;word-break:break-word;white-space:pre-wrap}
  .rv .rb .full{grid-column:1/-1}
  .rv .thumbs{display:flex;flex-wrap:wrap;gap:8px;grid-column:1/-1}
  .rv .thumbs span{display:flex;align-items:center;gap:8px;background:var(--ink);border:1px solid var(--line);border-radius:8px;padding:5px 9px 5px 5px;font-size:.78rem;text-transform:none;letter-spacing:0;color:var(--paper)}
  .rv .thumbs i{width:30px;height:30px;border-radius:6px;background:var(--steel) center/cover;display:flex;align-items:center;justify-content:center;font-style:normal}
  .check.big{padding:14px;border:1px solid rgba(244,163,0,.4);border-radius:12px;background:rgba(244,163,0,.05);color:var(--paper);line-height:1.5}
  .check.big input{width:20px;height:20px;flex:0 0 20px}

  .wizside{display:grid;gap:12px;position:sticky;top:120px}
  @media(max-width:860px){.wizside{position:static}}
  .sidecard{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
  .sidecard h4{font-size:.88rem;margin-bottom:6px}
  .sidecard p,.sidecard li{font-size:.8rem;color:var(--muted);line-height:1.5}
  .sidecard.red{border-color:rgba(229,83,75,.4);background:rgba(229,83,75,.07)}
  .sidecard a{color:#ff9b95}
  .mini{padding-left:18px;display:grid;gap:4px}

  .sendov{position:fixed;inset:0;z-index:90;background:rgba(5,9,18,.86);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center}
  .sendov[hidden]{display:none}
  .sendbox{position:relative;text-align:center;width:min(340px,90vw);padding:30px 24px;background:var(--panel);border:1px solid var(--line);border-radius:18px;animation:pop2 .4s both}
  .sring{width:130px;height:130px;transform:rotate(-90deg)}
  .sring circle{fill:none;stroke-width:8}
  .rt{stroke:var(--steel)}
  .rp{stroke:var(--amber);stroke-linecap:round;stroke-dasharray:327;stroke-dashoffset:327;transition:stroke-dashoffset .3s}
  .pct{position:absolute;top:30px;left:0;right:0;height:130px;display:flex;align-items:center;justify-content:center;font-family:'Archivo Black',sans-serif;font-size:1.5rem}
  .sendbox h3{margin-top:14px;font-size:1rem}

  .done{text-align:center;padding:34px 20px}
  .done[hidden]{display:none}
  .done .chk{width:96px;height:96px;margin:0 auto}
  .done .chk circle{fill:none;stroke:var(--green);stroke-width:5;stroke-dasharray:290;stroke-dashoffset:290;animation:draw .8s .1s forwards}
  .done .chk path{fill:none;stroke:var(--green);stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:draw .5s .8s forwards}
  @keyframes draw{to{stroke-dashoffset:0}}
  .done h2{font-family:'Archivo Black',sans-serif;font-size:1.5rem;margin:14px 0 4px;animation:up .5s .9s both}
  .done .refno{display:inline-block;margin:12px 0;padding:10px 20px;border-radius:12px;border:1px dashed var(--amber);background:rgba(244,163,0,.08);font-family:'Archivo Black',sans-serif;font-size:1.3rem;color:var(--amber);letter-spacing:.04em;animation:up .5s 1.05s both}
  .done p{color:var(--muted);max-width:480px;margin:6px auto;line-height:1.55;animation:up .5s 1.15s both}
  .done .got{max-width:480px;margin:14px auto 0;text-align:left;display:grid;gap:6px;animation:up .5s 1.25s both}
  .done .got div{font-size:.84rem;padding:8px 12px;border-radius:8px;background:var(--steel);border:1px solid var(--line);display:flex;justify-content:space-between;gap:10px}
  .done .got div.no{border-color:rgba(229,83,75,.4);color:#ff9b95}
  .done .acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px;animation:up .5s 1.35s both}
  #wiz{scroll-margin-top:110px}
  .wiz.finished .steps,.wiz.finished .wbar,.wiz.finished .wizgrid,.wiz.finished .wizhead{display:none}

  /* ===== civic issues ===== */
  .civgroups{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
  .cg{background:var(--steel);border:2px solid var(--line);border-radius:14px;padding:16px 14px;text-align:left;color:var(--paper);font:inherit;cursor:pointer;transition:transform .2s,border-color .2s,background .2s;animation:stepIn .45s both}
  .cg:nth-child(2){animation-delay:.05s}.cg:nth-child(3){animation-delay:.1s}.cg:nth-child(4){animation-delay:.15s}.cg:nth-child(5){animation-delay:.2s}
  .cg:hover{transform:translateY(-4px);border-color:var(--amber)}
  .cg.on{border-color:var(--amber);background:rgba(244,163,0,.1)}
  .cg .ic{font-size:1.9rem;display:block;margin-bottom:8px;transition:transform .3s}.cg:hover .ic,.cg.on .ic{transform:scale(1.2) rotate(-6deg)}
  .cg b{display:block;font-size:.9rem;line-height:1.25}.cg span.d{display:block;font-size:.74rem;color:var(--muted);margin-top:4px;line-height:1.35}
  #civTypes:not([hidden]){animation:stepIn .35s both}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .chipb{background:var(--ink);border:1px solid var(--line);color:var(--paper);font:inherit;font-size:.84rem;padding:8px 14px;border-radius:99px;cursor:pointer;transition:.18s}
  .chipb:hover{border-color:var(--amber);transform:translateY(-1px)}
  .chipb.on{background:var(--amber);color:#1a1200;border-color:var(--amber);font-weight:700}
  .chipb.danger{border-color:rgba(229,83,75,.55)}
  .ctxcard{border-radius:14px;padding:16px 18px;border:1px solid var(--line);background:var(--panel);line-height:1.55;font-size:.9rem;animation:stepIn .35s both}
  .ctxcard h3{font-size:1rem;margin-bottom:6px}
  .ctxcard ul{margin:8px 0 0 18px;display:grid;gap:3px}
  .ctxcard .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .ctxcard.red{border:2px solid var(--red);background:rgba(229,83,75,.1)}
  .ctxcard.red h3{color:#ff9b95}
  .ctxcard.red.pulse{animation:stepIn .35s both,redGlow 2s 0.4s infinite}
  @keyframes redGlow{0%,100%{box-shadow:0 0 0 0 rgba(229,83,75,.45)}50%{box-shadow:0 0 0 10px rgba(229,83,75,0)}}
  .ctxcard.blue{border-color:rgba(58,134,255,.5);background:rgba(58,134,255,.08)}
  .ctxcard.amber{border-color:rgba(244,163,0,.5);background:rgba(244,163,0,.07)}
  a.btn.callb{background:var(--red);border-color:var(--red);color:#fff;font-weight:800}
  .locrow{display:flex;gap:8px}.locrow input{flex:1}
  @media(max-width:520px){.locrow{flex-direction:column}}

  /* ===== police map ===== */
  .maphead{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .mapbtns{display:flex;gap:8px}
  .mapgrid{display:grid;grid-template-columns:1fr 320px;gap:14px}
  @media(max-width:860px){.mapgrid{grid-template-columns:1fr}}
  .mapwrap{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);height:min(560px,68vh);background:var(--panel)}
  #map{position:absolute;inset:0;background:#0f1a2e}
  .maploading{position:absolute;inset:0;display:flex;gap:10px;align-items:center;justify-content:center;color:var(--muted);background:var(--panel);z-index:500;transition:opacity .4s}
  .maploading.off{opacity:0;pointer-events:none}
  .maploading i{width:18px;height:18px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--amber);animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .maplist{display:grid;grid-template-rows:auto 1fr;gap:10px;height:min(560px,68vh)}
  .mapcards{overflow-y:auto;display:grid;gap:8px;align-content:start;padding-right:2px}
  .mc{background:var(--steel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;cursor:pointer;transition:.18s;animation:stepIn .3s both}
  .mc:hover,.mc.on{border-color:var(--amber);transform:translateX(3px)}
  .mc b{display:block;font-size:.88rem}.mc small{color:var(--muted);font-size:.76rem}
  .mc .dist{float:right;font-weight:800;color:var(--green);font-size:.8rem}
  .mc.first{border-color:rgba(61,190,122,.6);background:rgba(61,190,122,.08)}
  .pin{position:relative;width:26px;height:26px}
  .pin i{position:absolute;inset:6px;border-radius:50%;background:var(--blue);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)}
  .pin::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid var(--blue);animation:pinPulse 2.4s ease-out infinite}
  .pin.near i{background:var(--green)}.pin.near::after{border-color:var(--green)}
  .pin.me i{background:var(--amber)}.pin.me::after{border-color:var(--amber);animation-duration:1.6s}
  @keyframes pinPulse{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.2);opacity:0}}
  .leaflet-container{font-family:inherit}
  .leaflet-popup-content-wrapper{background:var(--panel);color:var(--paper);border:1px solid var(--line)}
  .leaflet-popup-tip{background:var(--panel)}
  .popb{display:grid;gap:6px;min-width:190px}.popb a{display:inline-block;margin-right:6px;font-size:.8rem;color:var(--amber);font-weight:700;text-decoration:none}
  .route{stroke-dasharray:8 8;animation:dash 1s linear infinite}
  @keyframes dash{to{stroke-dashoffset:-16}}
</style>
<style id="v4">
/* ===================== v4: new look (this page only) ===================== */
:root{
  --ink:#070c1f; --panel:#0d1430; --steel:#162049; --paper:#eef1ff;
  --amber:#35e0c2; --blue:#6c8cff; --green:#3ddc97; --red:#ff5c6c; --saffron:#ffb347; --violet:#9b7bff; --pink:#ff7aa8;
  --line:rgba(160,182,255,.17); --muted:rgba(226,232,255,.66);
  --grad:linear-gradient(135deg,#35e0c2 0%,#6c8cff 55%,#9b7bff 100%);
}
@property --ang{syntax:'<angle>';initial-value:0deg;inherits:false}
html{scroll-behavior:smooth}
body{background:var(--ink);position:relative;overflow-x:hidden}
main,footer.foot{position:relative;z-index:1}
main{max-width:1100px}
.tabpane.on{grid-template-columns:minmax(0,1fr)}
.hero-grid>*{min-width:0}
@media(max-width:620px){header .who{display:none}header{flex-wrap:nowrap}}

/* ---- animated background ---- */
.bgfx{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:radial-gradient(1200px 700px at 15% -10%,#101a4a 0%,transparent 60%),radial-gradient(900px 600px at 100% 100%,#1a1040 0%,transparent 55%),var(--ink)}
.bgfx .aur{position:absolute;border-radius:50%;filter:blur(90px);will-change:transform}
.bgfx .a1{width:60vmax;height:60vmax;left:-18vmax;top:-22vmax;background:#1fc7b0;opacity:.20;animation:drift1 26s ease-in-out infinite alternate}
.bgfx .a2{width:55vmax;height:55vmax;right:-20vmax;top:10vh;background:#6c5cff;opacity:.24;animation:drift2 32s ease-in-out infinite alternate}
.bgfx .a3{width:40vmax;height:40vmax;left:25vw;bottom:-22vmax;background:#ff8a5c;opacity:.14;animation:drift3 29s ease-in-out infinite alternate}
@keyframes drift1{to{transform:translate(18vmax,12vmax) scale(1.15)}}
@keyframes drift2{to{transform:translate(-16vmax,10vmax) scale(.9)}}
@keyframes drift3{to{transform:translate(-14vmax,-8vmax) scale(1.2)}}
.bgfx .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(150,175,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(150,175,255,.05) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse at 50% 25%,#000 10%,transparent 72%);mask-image:radial-gradient(ellipse at 50% 25%,#000 10%,transparent 72%);animation:gridMove 40s linear infinite}
@keyframes gridMove{to{background-position:60px 60px,60px 60px}}
.bgfx canvas{position:absolute;inset:0}
.progress{position:fixed;top:0;left:0;height:3px;width:0;background:var(--grad);z-index:70;box-shadow:0 0 12px rgba(53,224,194,.8)}

/* ---- header + tabs ---- */
header{background:rgba(7,11,28,.72);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);min-height:57px;padding-top:9px;padding-bottom:9px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Archivo Black','Inter',sans-serif;font-size:1.05rem;letter-spacing:.01em}
.brand .logo{width:32px;height:32px;filter:drop-shadow(0 4px 12px rgba(53,224,194,.45));animation:logoPulse 4s ease-in-out infinite}
@keyframes logoPulse{50%{transform:scale(1.07) rotate(-2deg)}}
.brand .bt{font-weight:inherit}
.brand span{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.navtabs{background:rgba(7,11,28,.7);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);padding:8px 18px;gap:6px}
.navtabs button{border-radius:99px;border-bottom:0;padding:9px 16px;transition:background .25s,color .25s,transform .2s}
.navtabs button:hover{background:rgba(255,255,255,.07);transform:translateY(-1px)}
.navtabs button.on{background:var(--grad);color:#04122b;box-shadow:0 6px 18px rgba(53,224,194,.28)}

/* ---- buttons ---- */
a.btn,button.btn{background:rgba(255,255,255,.06);border-color:var(--line);transition:transform .18s,border-color .2s,background .2s,box-shadow .2s}
a.btn:hover,button.btn:hover{border-color:var(--amber);background:rgba(53,224,194,.1);transform:translateY(-2px)}
a.btn:active,button.btn:active{transform:scale(.97)}
button.primary,button.btn.primary{background:var(--grad);color:#04122b;border:0;box-shadow:0 8px 22px rgba(80,140,255,.35)}
button.primary:hover,button.btn.primary:hover{background:var(--grad);box-shadow:0 12px 28px rgba(80,140,255,.5)}

/* ---- glass surfaces ---- */
.panel{background:rgba(13,20,48,.58);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);border-radius:20px;box-shadow:0 14px 44px rgba(0,0,0,.28)}
.card,.stat{background:rgba(22,32,73,.62);border-radius:14px}
select,textarea,input{background:rgba(7,12,31,.7);border-radius:10px;transition:border-color .2s,box-shadow .2s}
select:focus,textarea:focus,input:focus{outline:none;border-color:var(--amber);box-shadow:0 0 0 3px rgba(53,224,194,.2)}
.tag.Major,.tag.s-awaiting,.chip.Pending{background:rgba(255,179,71,.14);color:#ffc069;border-color:rgba(255,179,71,.4)}
.tag.Minor{background:rgba(108,140,255,.16);color:#a9bcff;border-color:rgba(108,140,255,.4)}
.tabpane h2::before,.sechead h2::before{content:"";display:inline-block;vertical-align:-.15em;width:4px;height:1.15em;border-radius:4px;margin-right:10px;background:var(--grad)}
.av{background:linear-gradient(135deg,var(--amber),var(--violet))}
.av.blue{background:linear-gradient(135deg,var(--blue),#a9bcff)}
.conv.on{background:rgba(53,224,194,.09);box-shadow:inset 3px 0 var(--amber)}
.msg{background:rgba(13,20,48,.6);border-radius:18px}
.bub.me{background:var(--grad);color:#04122b}
.seg{background:rgba(255,255,255,.04);border-radius:99px;padding:3px}
.seg button{border-radius:99px;transition:.2s}
.seg button.on{background:var(--grad);color:#04122b}

/* ---- spotlight hover ---- */
.svc,.cg,.tcard,.sos a,.ncard,.panel{position:relative}
.svc::before,.cg::before,.tcard::before,.sos a::before,.ncard::before,.panel::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(280px circle at var(--mx,50%) var(--my,50%),rgba(130,170,255,.16),transparent 62%);opacity:0;transition:opacity .35s;pointer-events:none;z-index:2}
.svc:hover::before,.cg:hover::before,.tcard:hover::before,.sos a:hover::before,.ncard:hover::before,.panel:hover::before{opacity:1}

/* ---- icons ---- */
.ico{width:1em;height:1em;display:block}
[data-ic] svg,.ic svg,.ti svg,.cg .ic svg{width:100%;height:100%;display:block}

/* ---- hero ---- */
.hello{padding:38px 34px;border-radius:26px;border:1.5px solid transparent;
  background:linear-gradient(rgba(9,14,38,.78),rgba(9,14,38,.78)) padding-box,conic-gradient(from var(--ang),#35e0c2,#6c8cff,#ff7aa8,#ffb347,#35e0c2) border-box;
  animation:spinBorder 9s linear infinite;box-shadow:0 24px 70px rgba(40,70,200,.25)}
@keyframes spinBorder{to{--ang:360deg}}
.hello .orb.o1{background:#6c5cff;opacity:.3}.hello .orb.o2{background:#35e0c2;opacity:.26}
.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#bfe9ff;background:rgba(255,255,255,.07);border:1px solid var(--line);padding:6px 12px;border-radius:99px;margin-bottom:16px}
.eyebrow .live{width:8px;height:8px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 0 rgba(61,220,151,.7);animation:liveDot 1.8s infinite}
@keyframes liveDot{70%{box-shadow:0 0 0 9px rgba(61,220,151,0)}100%{box-shadow:0 0 0 0 rgba(61,220,151,0)}}
.hello h1{font-size:clamp(1.7rem,4.4vw,2.7rem)}
.hello h1 em{background:linear-gradient(90deg,#ffd27a,#ff9b6a,#ff7aa8,#ffd27a);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmerText 6s linear infinite}
@keyframes shimmerText{to{background-position:220% 0}}
.hello h1,.hello p,.hello .quick,.hero-chips{position:relative;z-index:1}
.hero-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.hchip{display:flex;align-items:center;gap:8px;padding:7px 12px 7px 8px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line);font-size:.74rem;color:var(--muted);animation:chipFloat 5s ease-in-out infinite}
.hchip:nth-child(2){animation-delay:-1.6s}.hchip:nth-child(3){animation-delay:-3.2s}
.hchip i{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(53,224,194,.28),rgba(108,140,255,.28));color:var(--amber);padding:5px}
.hchip b{display:block;color:var(--paper);font-size:.8rem}
@keyframes chipFloat{50%{transform:translateY(-5px)}}
.hero-art{display:flex;justify-content:center;align-items:center;position:relative}
.nam{width:min(310px,64vw);height:auto;overflow:visible;filter:drop-shadow(0 18px 40px rgba(255,150,100,.25))}
.nm-aura{animation:nmBreath 4.5s ease-in-out infinite;transform-origin:120px 122px}
@keyframes nmBreath{50%{transform:scale(1.08);opacity:.85}}
.nm-ring.r1{animation:nmSpin 40s linear infinite}.nm-ring.r2{animation:nmSpin 70s linear infinite reverse}
@keyframes nmSpin{to{transform:rotate(360deg)}}
.pt{transform-box:fill-box;transform-origin:50% 100%;animation:nmSway 5s ease-in-out infinite;animation-delay:var(--d)}
@keyframes nmSway{50%{transform:scale(1.05)}}
.nm-hands{animation:nmFloat 5s ease-in-out infinite}
@keyframes nmFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.sp{animation:nmTw 2.6s ease-in-out infinite;animation-delay:var(--d);transform-box:fill-box;transform-origin:center}
@keyframes nmTw{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1.15)}}
@media(max-width:820px){.hero-grid{grid-template-columns:minmax(0,1fr)}.eyebrow{font-size:.66rem;letter-spacing:.08em}.hero-art{order:-1;margin-bottom:-10px}.nam{width:min(220px,58vw)}.hello{padding:26px 20px}}

/* ---- ticker ---- */
.ticker{background:rgba(13,20,48,.6);border-radius:14px}
.ticker span{display:inline-flex;align-items:center;gap:9px}
.ticker span span{padding:0}
.ticker .tk{width:16px;height:16px;color:var(--amber);flex:0 0 auto}

/* ---- promo carousel ---- */
.promo{border-radius:22px;min-height:230px;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.promo::after{content:"";position:absolute;inset:0;background:radial-gradient(500px circle at 85% 20%,rgba(255,255,255,.18),transparent 60%),repeating-linear-gradient(135deg,transparent 0 22px,rgba(255,255,255,.035) 22px 44px);pointer-events:none;z-index:2}
.slide .art{position:relative;display:grid;place-items:center;width:clamp(110px,18vw,170px);height:clamp(110px,18vw,170px);flex:0 0 auto;font-size:0;filter:none;animation:none}
.slide .art svg{width:46%;height:46%;color:#fff;stroke-width:1.5;position:relative;z-index:1;animation:bob 3.4s ease-in-out infinite;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35))}
.slide .art::before{content:"";position:absolute;inset:14%;border-radius:50%;background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.35)}
.slide .art .rg1,.slide .art .rg2{position:absolute;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);animation:ringOut 3.2s ease-out infinite}
.slide .art .rg1{inset:14%}.slide .art .rg2{inset:14%;animation-delay:1.6s}
@keyframes ringOut{from{transform:scale(1);opacity:.8}to{transform:scale(1.65);opacity:0}}
.slide .pbar{position:absolute;left:0;bottom:0;height:3px;width:0;background:rgba(255,255,255,.85);z-index:3}
.slide.on .pbar{animation:pbar 5.2s linear forwards}
@keyframes pbar{to{width:100%}}
.slide .tx h3,.slide .tx p,.slide .tx .kick,.slide .tx .btn{opacity:0;transform:translateY(14px)}
.slide.on .tx h3,.slide.on .tx p,.slide.on .tx .kick,.slide.on .tx .btn{animation:txIn .7s cubic-bezier(.2,.8,.2,1) forwards}
.slide.on .tx .kick{animation-delay:.1s}.slide.on .tx h3{animation-delay:.2s}.slide.on .tx p{animation-delay:.3s}.slide.on .tx .btn{animation-delay:.42s}
@keyframes txIn{to{opacity:1;transform:none}}
.promo .adtag{background:rgba(0,0,0,.4);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}

/* ---- helplines ---- */
.sos a{border-radius:16px;background:rgba(22,32,73,.6);padding:16px 16px 14px;overflow:hidden;transition:transform .2s,border-color .2s,box-shadow .2s}
.sos a:hover{transform:translateY(-4px);border-color:var(--amber);box-shadow:0 14px 30px rgba(0,0,0,.3)}
.sos a b{color:var(--amber);font-size:1.6rem}
.sos a.red b{color:#ff8e9a}
.sos a [data-ic]{position:absolute;right:12px;top:12px;width:30px;height:30px;padding:6px;border-radius:10px;background:rgba(255,255,255,.07);color:var(--amber)}
.sos a.red [data-ic]{color:#ff8e9a;background:rgba(255,92,108,.14);animation:ringBuzz 2.6s ease-in-out infinite}
@keyframes ringBuzz{0%,60%,100%{transform:rotate(0)}65%{transform:rotate(-14deg)}70%{transform:rotate(12deg)}75%{transform:rotate(-10deg)}80%{transform:rotate(8deg)}}

/* ---- reels ---- */
.reelc{border-radius:18px;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s}
.reelc:hover{transform:translateY(-8px) scale(1.04);box-shadow:0 18px 36px rgba(0,0,0,.45),0 0 0 1px rgba(53,224,194,.5)}
.reelc .play{background:rgba(255,255,255,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:transform .25s}
.reelc:hover .play{transform:scale(1.2)}

/* ---- news ---- */
.ncard{border-radius:16px;background:rgba(22,32,73,.62);transition:transform .25s cubic-bezier(.2,.8,.2,1),border-color .25s,box-shadow .25s}
.ncard:hover{transform:translateY(-5px);border-color:rgba(53,224,194,.6);box-shadow:0 16px 34px rgba(0,0,0,.35)}
.thumb img{transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.ncard:hover .thumb img{transform:scale(1.07)}
.thumb .em{width:56px;height:56px;color:#fff;filter:drop-shadow(0 6px 12px rgba(0,0,0,.4));font-size:0}
.thumb.big .em{width:86px;height:86px}
.thumb .em svg{width:100%;height:100%;stroke-width:1.4}
.react button.on{color:var(--amber)}

/* ---- services ---- */
.svc{border-radius:16px;background:rgba(22,32,73,.6)}
.svc:hover,.svc.on{background:rgba(53,224,194,.09);border-color:var(--amber);box-shadow:0 14px 30px rgba(0,0,0,.28)}
.svc .ic{width:46px;height:46px;padding:11px;border-radius:14px;margin-bottom:12px;color:var(--amber);background:linear-gradient(135deg,rgba(53,224,194,.2),rgba(108,140,255,.22));transition:transform .3s,background .3s,color .3s}
.svc:hover .ic,.svc.on .ic{transform:translateY(-3px) rotate(-6deg) scale(1.08);background:var(--grad);color:#04122b}

.cg{border-radius:16px;background:rgba(22,32,73,.6);overflow:hidden}
.cg:hover,.cg.on{background:rgba(53,224,194,.09);border-color:var(--amber);box-shadow:0 14px 30px rgba(0,0,0,.28)}
.cg .ic{width:46px;height:46px;padding:11px;border-radius:14px;margin-bottom:12px;color:var(--amber);background:linear-gradient(135deg,rgba(53,224,194,.2),rgba(108,140,255,.22));font-size:0}
.cg:hover .ic,.cg.on .ic{background:var(--grad);color:#04122b}

/* ---- trust ---- */
.tcard{border-radius:18px;background:rgba(22,32,73,.6);transition:transform .25s,border-color .25s}
.tcard:hover{transform:translateY(-4px);border-color:rgba(53,224,194,.5)}
.tcard .ti{display:block;width:46px;height:46px;padding:11px;border-radius:14px;color:var(--amber);background:linear-gradient(135deg,rgba(53,224,194,.2),rgba(108,140,255,.22))}
.tcard b.n{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;margin-top:12px}
.tcard::after{background:radial-gradient(#6c8cff,transparent 70%)}

/* ---- chat demo ---- */
.chatdemo ul li{display:flex;align-items:center;gap:12px}
.chatdemo ul li [data-ic]{width:34px;height:34px;padding:8px;border-radius:11px;background:rgba(53,224,194,.12);color:var(--amber);flex:0 0 auto}
.chatdemo .mock{background:rgba(7,12,31,.75);border-radius:18px}

/* ---- staggered reveal ---- */
.reveal:not(.in) .svc,.reveal:not(.in) .tcard,.reveal:not(.in) .ncard{opacity:0}
.sos.reveal:not(.in) a{opacity:0}
.reveal.in .svc,.reveal.in .tcard,.reveal.in .ncard,.reveal.in.sos a{animation:rise .65s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*70ms)}
@keyframes rise{from{opacity:0;transform:translateY(26px) scale(.97)}to{opacity:1;transform:none}}
.svc:nth-child(1),.tcard:nth-child(1),.ncard:nth-child(1),.sos a:nth-child(1){--i:1}
.svc:nth-child(2),.tcard:nth-child(2),.ncard:nth-child(2),.sos a:nth-child(2){--i:2}
.svc:nth-child(3),.tcard:nth-child(3),.ncard:nth-child(3),.sos a:nth-child(3){--i:3}
.svc:nth-child(4),.tcard:nth-child(4),.ncard:nth-child(4),.sos a:nth-child(4){--i:4}
.svc:nth-child(5),.ncard:nth-child(5){--i:5}
.svc:nth-child(6),.ncard:nth-child(6){--i:6}
.svc:nth-child(7),.ncard:nth-child(7){--i:7}
.ncard:nth-child(8){--i:8}

/* ---- floating SOS + footer ---- */
.fabsos{background:linear-gradient(135deg,#ff5c6c,#ff8a5c);box-shadow:0 10px 28px rgba(255,92,108,.5);border-radius:99px;padding:12px 20px 12px 14px}
.fabsos [data-ic]{width:24px;height:24px}
.foot{max-width:1100px;margin:0 auto;padding:10px 18px 90px;display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;justify-content:space-between;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line)}
.foot b{color:var(--paper)}
.foot .fl{display:flex;gap:18px;flex-wrap:wrap}
.foot a{color:var(--amber);text-decoration:none;font-weight:700}
@media (prefers-reduced-motion: reduce){.bgfx .aur,.bgfx .grid,.hello{animation:none!important}.reveal .svc,.reveal .tcard,.reveal .ncard,.sos.reveal a{opacity:1!important}}
</style>
<meta name="theme-color" content="#0B1220">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="stylesheet" href="mobile.css">
</head>
<body>
<div class="bgfx" aria-hidden="true"><div class="aur a1"></div><div class="aur a2"></div><div class="aur a3"></div><div class="grid"></div><canvas id="bgc"></canvas></div>
<div class="progress" id="prog"></div>
<header class="topbar">
  <div class="hl">
    <a class="brand" href="#home" data-go="home" aria-label="SurakshaSetu home"><span class="brandmark"><img class="logo" src="icon-192.png" alt="" width="36" height="36"></span><b class="bt">Suraksha<span>Setu</span></b></a>
    <label class="langsel" title="Language"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z"/></svg><select id="langPick" aria-label="Language"><option value="en">English</option></select></label>
  </div>
  <div class="hr">
    <button class="aipill" id="aiTop" data-go="ai" type="button" aria-label="Suraksha AI"><span class="spark" aria-hidden="true"></span><b class="aiglow">Suraksha AI</b></button>
    <div class="profwrap">
      <button class="avatar" id="avatarBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Profile menu"><span id="avatarIni">?</span></button>
      <div class="profmenu" id="profMenu" hidden>
        <div class="pm-head"><div class="avatar big"><span id="avatarIni2">?</span></div><div><div class="who" id="who"><%= loggedInName %></div><div class="pm-sub" id="pmSub"></div></div></div>
        <button type="button" id="openProfile"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>My profile</button>
        <a class="pm-out" id="logoutLink" href="logout"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/></svg>Log out</a>
      </div>
    </div>
  </div>
</header>

<nav class="navtabs" id="nav">
  <button data-t="home" class="on">Home</button>
  <button data-t="ai" class="ainav"><span class="aiglow">Suraksha AI</span></button>
  <button data-t="file">File a case</button>
  <button data-t="efir">e-FIR</button>
  <button data-t="appt">Appointments</button>
  <button data-t="chat">Chat with police</button>
  <button data-t="civic">Civic issues</button>
  <button data-t="concern">Report a concern</button>
  <button data-t="community">Community</button>
  <button data-t="map">Police near me</button>
  <button data-t="cases">My cases</button>
  <button data-t="law">Know Your Law</button>
  <button data-t="road">Road Safety</button>
  <button data-t="women">Women’s Safety</button>
  <button data-t="rag">Anti-Ragging</button>
</nav>

<main>

<!-- ============ HOME ============ -->
<section class="tabpane on" id="t-home">
  <div class="hello hero">
    <span class="orb o1"></span><span class="orb o2"></span>
    <div class="hero-grid">
      <div class="hero-text">
        <span class="eyebrow"><i class="live"></i>Citizen safety portal &middot; Online 24&times;7</span>
        <h1 id="greet">Namaste</h1>
        <p>We are glad you are here. If something has happened to you or someone close to you, you do not have to face it alone. Tell us what happened &mdash; your nearest police station will take it from there, and you can follow every step right here.</p>
        <div class="quick">
          <button class="btn primary" data-go="file">Report an incident</button>
          <button class="btn" data-go="efir">Register an e-FIR</button>
          <button class="btn" data-go="appt">Book an appointment</button>
          <button class="btn" data-go="chat">Chat with a station</button>
          <button class="btn" data-go="map">Police near me</button>
          <button class="btn" data-go="civic">Civic issues</button>
        </div>
        <div class="hero-chips">
          <div class="hchip"><i data-ic="clock"></i><span><b>24&times;7 filing</b>No queue</span></div>
          <div class="hchip"><i data-ic="lock"></i><span><b>Private</b>Officer only</span></div>
          <div class="hchip"><i data-ic="pin"></i><span><b>Live tracking</b>Every step</span></div>
        </div>
      </div>
      <div class="hero-art">
<svg class="nam" viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Namaste">
  <defs>
    <radialGradient id="nmAura" cx="50%" cy="48%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".55" stop-color="#ff9b6a" stop-opacity=".22"/><stop offset="1" stop-color="#ff9b6a" stop-opacity="0"/></radialGradient>
    <linearGradient id="nmPetal" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb347"/><stop offset=".55" stop-color="#ff7aa8"/><stop offset="1" stop-color="#ffd6e7"/></linearGradient>
    <linearGradient id="nmPetal2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9f43"/><stop offset="1" stop-color="#ff6f9c"/></linearGradient>
    <linearGradient id="nmSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe0c2"/><stop offset="1" stop-color="#e9a97c"/></linearGradient>
    <linearGradient id="nmSleeve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c5be0"/><stop offset="1" stop-color="#252d7a"/></linearGradient>
    <linearGradient id="nmGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe29a"/><stop offset=".5" stop-color="#ffb938"/><stop offset="1" stop-color="#d98a12"/></linearGradient>
    <linearGradient id="nmRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#35e0c2"/><stop offset=".5" stop-color="#6c8cff"/><stop offset="1" stop-color="#ffb347"/></linearGradient>
    <symbol id="nmStar" viewBox="-10 -10 20 20"><path d="M0-10 C1.2-3 3-1.2 10 0 C3 1.2 1.2 3 0 10 C-1.2 3 -3 1.2 -10 0 C-3-1.2 -1.2-3 0-10Z"/></symbol>
  </defs>

  <circle class="nm-aura" cx="120" cy="122" r="112" fill="url(#nmAura)"/>
  <g class="nm-ring r1" style="transform-origin:120px 122px"><circle cx="120" cy="122" r="104" fill="none" stroke="url(#nmRing)" stroke-width="1.4" stroke-dasharray="2 9" stroke-linecap="round" opacity=".9"/></g>
  <g class="nm-ring r2" style="transform-origin:120px 122px"><circle cx="120" cy="122" r="116" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1" stroke-dasharray="22 14"/></g>

  <!-- lotus -->
  <g transform="translate(120 206)">
    <g class="nm-petals">
      <path class="pt" style="--d:0s"   transform="rotate(-78) scale(.78)" d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal2)" opacity=".85"/>
      <path class="pt" style="--d:.15s" transform="rotate(78) scale(.78)"  d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal2)" opacity=".85"/>
      <path class="pt" style="--d:.3s"  transform="rotate(-54) scale(.92)" d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal)" opacity=".92"/>
      <path class="pt" style="--d:.45s" transform="rotate(54) scale(.92)"  d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal)" opacity=".92"/>
      <path class="pt" style="--d:.6s"  transform="rotate(-28) scale(1.02)" d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal)"/>
      <path class="pt" style="--d:.75s" transform="rotate(28) scale(1.02)"  d="M0 0C-24-24-20-64 0-88C20-64 24-24 0 0Z" fill="url(#nmPetal)"/>
    </g>
  </g>

  <!-- hands -->
  <g class="nm-hands">
    <g id="nmHandL">
      <path d="M120 34C106 50 93 92 94 138C95 160 100 178 106 192L120 192Z" fill="url(#nmSkin)" stroke="#b9714a" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M112 56C110.5 82 110.5 104 112 128" fill="none" stroke="#b9714a" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M103.5 80C102.5 100 102.5 116 104 134" fill="none" stroke="#b9714a" stroke-opacity=".42" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M119 122C112 124 107 138 111 156C115 162 119 156 119 150Z" fill="#ffd4b0" stroke="#b9714a" stroke-opacity=".5" stroke-width="1"/>
    </g>
    <use href="#nmHandL" transform="translate(240 0) scale(-1 1)"/>
    <path d="M120 34V192" stroke="#8f4f2f" stroke-opacity=".6" stroke-width="1.3" stroke-linecap="round"/>
  </g>

  <!-- sleeves + bangles -->
  <g id="nmSleeveL">
    <path d="M89 190H121V228C106 233 90 231 77 224C82 212 86 201 89 190Z" fill="url(#nmSleeve)"/>
    <path d="M77 224C90 231 106 233 121 228V219C107 224 91 222 80 216Z" fill="#ffb347"/>
    <path d="M84 203C92 207 106 208 121 205" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M82 211C93 216 107 216 121 213" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="2.5 4" stroke-linecap="round"/>
    <ellipse cx="105" cy="191" rx="16" ry="4" fill="none" stroke="url(#nmGold)" stroke-width="3"/>
    <ellipse cx="105" cy="198" rx="16" ry="3.8" fill="none" stroke="url(#nmGold)" stroke-width="2" opacity=".85"/>
  </g>
  <use href="#nmSleeveL" transform="translate(240 0) scale(-1 1)"/>

  <!-- sparkles -->
  <use href="#nmStar" class="sp" style="--d:0s"   x="38"  y="52"  width="14" height="14" fill="#ffe29a"/>
  <use href="#nmStar" class="sp" style="--d:.8s"  x="196" y="70"  width="11" height="11" fill="#9fe9ff"/>
  <use href="#nmStar" class="sp" style="--d:1.5s" x="28"  y="150" width="9"  height="9"  fill="#ffd0e4"/>
  <use href="#nmStar" class="sp" style="--d:.4s"  x="206" y="156" width="13" height="13" fill="#ffe29a"/>
  <use href="#nmStar" class="sp" style="--d:1.1s" x="150" y="14"  width="10" height="10" fill="#ffffff"/>
</svg>

      </div>
    </div>
  </div>

  <div class="ticker reveal"><div class="track" id="ticker"></div></div>

  <div class="promo reveal" id="promo"></div>

  <div class="sos reveal">
    <a class="red" href="tel:112"><i data-ic="siren"></i><b>112</b><span>Emergency (Police / Fire / Ambulance)</span></a>
    <a href="tel:1930"><i data-ic="card"></i><b>1930</b><span>Cyber fraud helpline</span></a>
    <a href="tel:1091"><i data-ic="users"></i><b>1091</b><span>Women helpline</span></a>
    <a href="tel:1098"><i data-ic="shield"></i><b>1098</b><span>Childline</span></a>
  </div>

  <div class="panel reveal">
    <div class="sechead"><h2 style="margin:0">Safety Reels</h2><span class="hint">Tap a reel &middot; 30-second tips</span></div>
    <div class="rail" id="reels"></div>
  </div>

  <div class="panel reveal">
    <div class="sechead">
      <h2 style="margin:0">Latest police &amp; law-and-order news</h2>
      <div class="seg" id="newsSeg"><button data-r="All" class="on">All</button><button data-r="Bengaluru">Bengaluru</button><button data-r="India">India</button></div>
    </div>
    <div id="news"><div class="empty">Loading headlines…</div></div>
    <div class="hint livedot" id="newsNote"></div>
  </div>

  <div class="reveal">
    <h2 style="margin-bottom:12px">Why citizens trust SurakshaSetu</h2>
    <div class="trust">
      <div class="tcard"><span class="ti" data-ic="lock"></span><b class="n" data-count="100" data-suffix="%">0</b><h4>Private by design</h4><p>Only you and the assigned officer can see your case details.</p></div>
      <div class="tcard"><span class="ti" data-ic="clock"></span><b class="n" data-count="24" data-suffix="×7">0</b><h4>Always open</h4><p>File a complaint any time, even at 2 a.m. No queue, no waiting room.</p></div>
      <div class="tcard"><span class="ti" data-ic="compass"></span><b class="n" data-count="3" data-suffix=" levels">0</b><h4>Priority-first</h4><p>Minor, Major and Critical cases are sorted so urgent ones reach an officer first.</p></div>
      <div class="tcard"><span class="ti" data-ic="pin"></span><b class="n" data-count="7" data-suffix=" case types">0</b><h4>Track every step</h4><p>See when an officer is assigned, accepts your case, or confirms your appointment.</p></div>
    </div>
  </div>

  <div class="panel reveal chatdemo" id="chatdemo">
    <div class="mock" id="mock"></div>
    <div>
      <h2>Talk to your nearest police station</h2>
      <ul><li><i data-ic="chat"></i>Share your problem in your own words</li><li><i data-ic="clip"></i>Ask what documents to carry</li><li><i data-ic="check"></i>Get a reply from a real officer, not a bot</li></ul>
      <button class="btn primary" data-go="chat">Start a conversation</button>
      <div class="hint" style="margin-top:10px">Emergency? Do not wait for a reply &mdash; dial 112.</div>
    </div>
  </div>

  <div class="panel reveal">
    <h2>Our services</h2>
    <div class="services" id="services"></div>
    <div class="hint" style="margin-top:12px">Tap a service to start a report. Every report is classified as <b>Minor</b>, <b>Major</b> or <b>Critical</b> so urgent cases reach an officer first.</div>
  </div>
</section>

<!-- ============ FILE A CASE ============ -->
<section class="tabpane" id="t-file">
  <div class="wiz" id="wiz">
    <div class="wizhead">
      <div>
        <h2>File a complaint</h2>
        <p class="hint" style="margin:2px 0 0">About 5 minutes. Take your time &mdash; you will review everything before it is sent.</p>
      </div>
      <div class="secbadge"><svg viewBox="0 0 34 38" fill="none" width="18" height="20"><path d="M17 1L32 7V18C32 27 25.5 33.5 17 37C8.5 33.5 2 27 2 18V7L17 1Z" stroke="currentColor" stroke-width="2.4"/><path d="M11 19L15 23L24 13" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Private &amp; confidential</div>
    </div>

    <ol class="steps" id="steps">
      <li class="on" data-s="1"><i>1</i><span>Incident</span></li>
      <li data-s="2"><i>2</i><span>Financial</span></li>
      <li data-s="3"><i>3</i><span>Evidence</span></li>
      <li data-s="4"><i>4</i><span>Review &amp; submit</span></li>
    </ol>
    <div class="wbar"><i id="wbar"></i></div>

    <div class="wizgrid" id="wizgrid">
      <div class="panel wizbody">

        <!-- STEP 1 -->
        <div class="step on" id="s1">
          <h3 class="sh">What happened?</h3>
          <label>Type of case</label>
          <div class="services" id="fileServices"></div>

          <div class="grid2">
            <div><label for="incDate">Date of incident</label><input id="incDate" type="date"></div>
            <div><label for="incTime">Approximate time <span class="opt">(optional)</span></label><input id="incTime" type="time"></div>
          </div>

          <label for="description">Describe the incident</label>
          <textarea id="description" maxlength="4000" placeholder="What happened, in order? Who was involved? (min. 10 characters)"></textarea>
          <div class="hint"><span id="count">0</span> characters</div>
          <div class="sev" id="sev"><span class="hint">Choose a case type and start describing &mdash; the priority appears here.</span></div>

          <h3 class="sh">Where &amp; how</h3>
          <div class="grid2">
            <div><label for="platform">Platform involved <span class="opt">(if online)</span></label>
              <select id="platform"><option value="">Not applicable / not sure</option></select></div>
            <div><label for="identifiers">Identifiers <span class="opt">(optional)</span></label>
              <input id="identifiers" maxlength="400" placeholder="Phone no., email, UPI ID, profile link, website, vehicle no."></div>
          </div>
          <label for="location">Place of incident</label>
          <input id="location" maxlength="300" placeholder="Area / street / landmark (for online cases: where you were)">
          <div class="grid3">
            <div><label for="city">City / district</label><input id="city" maxlength="80" placeholder="e.g. Bengaluru"></div>
            <div><label for="state">State</label><input id="state" maxlength="80" placeholder="e.g. Karnataka"></div>
            <div><label for="juris">Police station / jurisdiction <span class="opt">(if known)</span></label><input id="juris" maxlength="120" placeholder="e.g. Koramangala PS"></div>
          </div>
        </div>

        <!-- STEP 2 -->
        <div class="step" id="s2">
          <h3 class="sh">Did you lose money?</h3>
          <div class="yn" id="lossYN">
            <button type="button" data-v="yes"><b>Yes</b><span>I lost money or was asked to pay</span></button>
            <button type="button" data-v="no"><b>No</b><span>No money involved</span></button>
          </div>
          <div class="callout" id="lossTip">If money was taken through a bank or UPI, call <b>1930</b> as soon as possible &mdash; acting within the first hour improves the chance of freezing the transfer.</div>

          <div id="finFields" class="finfields">
            <div class="grid2">
              <div><label for="amount">Amount lost (&#8377;)</label><input id="amount" inputmode="decimal" placeholder="e.g. 25000"></div>
              <div><label for="payMethod">Payment method</label>
                <select id="payMethod"><option value="">Choose&hellip;</option></select></div>
              <div><label for="bank">Bank / payment provider <span class="opt">(optional)</span></label><input id="bank" maxlength="120" placeholder="e.g. HDFC Bank, PhonePe, Paytm"></div>
              <div><label for="txnRef">Transaction reference / UTR <span class="opt">(optional)</span></label><input id="txnRef" maxlength="80" placeholder="e.g. 4057xxxxxx21"></div>
              <div><label for="txnDate">Transaction date <span class="opt">(optional)</span></label><input id="txnDate" type="date"></div>
              <div><label for="payee">Paid to (account / UPI ID / card) <span class="opt">(optional)</span></label><input id="payee" maxlength="200" placeholder="Receiver account number, UPI ID or phone"></div>
            </div>
            <div class="hint">Never type your PIN, OTP, CVV or full card number here &mdash; the police will never ask for them.</div>
          </div>
          <div class="nafin" id="naFin">No financial details needed. You can continue to the next step.</div>
        </div>

        <!-- STEP 3 -->
        <div class="step" id="s3">
          <h3 class="sh">Add digital evidence</h3>
          <div class="drop" id="drop" tabindex="0" role="button" aria-label="Add evidence files">
            <div class="dico">📎</div>
            <b>Drag &amp; drop files here, or tap to choose</b>
            <span>Screenshots, photos, emails, transaction receipts, chat exports</span>
            <div class="dbtns">
              <button type="button" class="btn" id="pickBtn">Choose files</button>
              <button type="button" class="btn" id="camBtn">📷 Take a photo</button>
            </div>
          </div>
          <input type="file" id="fileIn" multiple hidden accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.eml,.txt,.csv,.docx,.xlsx,image/*,application/pdf">
          <input type="file" id="camIn" accept="image/*" capture="environment" hidden>
          <div class="hint">Allowed: JPG, PNG, WebP, GIF, PDF, EML, TXT, CSV, DOCX, XLSX &middot; up to <b>6 files</b> &middot; <b>5 MB</b> each. Keep the originals &mdash; do not edit screenshots.</div>
          <div class="flist" id="flist"></div>
          <div class="fsum" id="fsum"></div>
        </div>

        <!-- STEP 4 -->
        <div class="step" id="s4">
          <h3 class="sh">Check everything before you submit</h3>
          <div id="review"></div>
          <label class="check big"><input type="checkbox" id="confirm"><span>I confirm that the information and files I have provided are true and correct to the best of my knowledge. I understand that giving false information to the police is an offence, and I agree to share this complaint with the police for investigation.</span></label>
        </div>

        <div class="wiznav">
          <button type="button" class="btn" id="wBack">&larr; Back</button>
          <button type="button" class="btn primary" id="wNext">Continue &rarr;</button>
        </div>
        <div class="banner" id="msg"></div>
      </div>

      <aside class="wizside">
        <div class="sidecard"><h4>🔒 Your privacy</h4><p>Only you and the officer assigned to your case can see these details and files.</p></div>
        <div class="sidecard"><h4>🧾 What happens next</h4>
          <ol class="mini"><li>You get a reference number straight away.</li><li>Your case is sorted by priority.</li><li>An officer is assigned and you can follow every step under <b>My cases</b>.</li></ol></div>
        <div class="sidecard red"><h4>🚨 In danger right now?</h4><p>Do not fill this form &mdash; call <a href="tel:112"><b>112</b></a>. Cyber fraud: <a href="tel:1930"><b>1930</b></a>.</p></div>
      </aside>
    </div>

    <!-- success -->
    <div class="done panel" id="done" hidden></div>
  </div>

  <!-- sending overlay -->
  <div class="sendov" id="sendov" hidden>
    <div class="sendbox">
      <svg class="sring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="rt"/><circle cx="60" cy="60" r="52" class="rp" id="ringP"/></svg>
      <div class="pct" id="ringT">0%</div>
      <h3 id="sendH">Preparing your complaint</h3>
      <p class="hint" id="sendP">Please keep this page open.</p>
    </div>
  </div>

  <div class="panel">
    <h2>How priority is decided</h2>
    <div class="legend">
      <div><span class="tag Minor">Minor</span><br>Property or non-violent matters, e.g. petty theft, harassment without threats.</div>
      <div><span class="tag Major">Major</span><br>Financial loss, force, threats or hacking, e.g. fraud, robbery, assault.</div>
      <div><span class="tag Critical">Critical</span><br>Danger to life: weapons, kidnapping, murder, missing persons.</div>
    </div>
  </div>
</section>

<!-- ============ e-FIR ============ -->
<section class="tabpane" id="t-efir">
  <div class="panel">
    <h2>Submit an e-FIR</h2>
    <p class="hint" style="margin:-4px 0 8px">An e-FIR records the full details of an incident. It is registered as a case, classified automatically, and sent to a matching officer.</p>
    <div class="grid2">
      <div><label for="f-cat">Offence type</label><select id="f-cat"><option value="">Choose…</option></select></div>
      <div><label for="f-place">Place of incident</label><input id="f-place" placeholder="Area / street / landmark, city"></div>
      <div><label for="f-date">Date of incident</label><input id="f-date" type="date"></div>
      <div><label for="f-time">Approx. time (optional)</label><input id="f-time" type="time"></div>
    </div>
    <label for="f-desc">Details of the incident</label>
    <textarea id="f-desc" placeholder="Describe the incident in order. At least 20 characters."></textarea>
    <div class="grid2">
      <div><label for="f-accused">Accused / suspect details (optional)</label><input id="f-accused" placeholder="Name, description, vehicle no., phone…"></div>
      <div><label for="f-wit">Witnesses (optional)</label><input id="f-wit" placeholder="Names and contact numbers"></div>
    </div>
    <label class="check"><input type="checkbox" id="f-decl"><span>I declare that the information I have given is true to the best of my knowledge. I understand that giving false information to the police is an offence.</span></label>
    <div style="margin-top:14px"><button class="btn primary" id="f-submit">Submit e-FIR</button></div>
    <div class="banner" id="f-msg"></div>
  </div>
  <div>
    <h2>My e-FIRs</h2>
    <div class="cases" id="efirs"><div class="empty">Loading…</div></div>
  </div>
</section>

<!-- ============ APPOINTMENTS ============ -->
<section class="tabpane" id="t-appt">
  <div class="panel">
    <h2>Book an appointment with the police</h2>
    <div class="grid2">
      <div><label for="a-station">Police station / officer</label><select id="a-station"><option value="">Loading…</option></select></div>
      <div><label for="a-purpose">Purpose</label>
        <select id="a-purpose"><option value="">Choose…</option><option>Submit documents</option><option>Meet investigating officer</option><option>Verify identity</option><option>Case follow-up</option><option>Statement recording</option><option>Other</option></select></div>
      <div><label for="a-date">Date</label><input id="a-date" type="date"></div>
      <div><label for="a-time">Time</label><input id="a-time" type="time" value="11:00"></div>
    </div>
    <div style="margin-top:14px"><button class="btn primary" id="a-submit">Request appointment</button></div>
    <div class="banner" id="a-msg"></div>
  </div>
  <div>
    <h2>My appointments</h2>
    <div class="cases" id="appts"><div class="empty">Loading…</div></div>
  </div>
</section>

<!-- ============ CHAT ============ -->
<section class="tabpane" id="t-chat">
  <div class="msg" id="msgBox">
    <div class="list"><h3>Nearby police stations</h3><div id="stations"></div></div>
    <div class="thread" id="thread"><div class="nothread">Select a police station to start a conversation.<br><span class="hint">Share your problem, ask about a case, or ask what documents to bring. For emergencies, always dial 112.</span></div></div>
  </div>
</section>

<!-- ============ CIVIC ISSUES ============ -->
<section class="tabpane" id="t-civic">
  <div class="panel civhead">
    <h2>Civic Issues &amp; Public Grievances</h2>
    <p class="hint" style="margin:0">Report problems in your neighbourhood &mdash; roads, trees, power and water, nuisance, sanitation. We route each report to the right authority. <b>Crimes and emergencies belong with the police &mdash; call 112.</b></p>
  </div>
  <div class="civgroups" id="civGroups"></div>
  <div id="civTypes" class="panel" hidden></div>
  <div id="civCtx"></div>
  <div class="panel" id="civForm" hidden>
    <h2 id="civFormH">Describe the problem</h2>
    <label for="cv-loc">Where is it?</label>
    <div class="locrow"><input id="cv-loc" maxlength="300" placeholder="Street, landmark, area"><button type="button" class="btn" id="cv-gps">📍 Use my location</button></div>
    <div class="hint" id="cv-gpsnote"></div>
    <label for="cv-desc">What is the problem?</label>
    <textarea id="cv-desc" maxlength="2000" placeholder="Describe what you see, how big it is, and since when (min. 10 characters)"></textarea>
    <label class="check"><input type="checkbox" id="cv-urgent"><span>It is blocking a road or could hurt people or animals soon.</span></label>
    <div style="margin-top:14px"><button class="btn primary" id="cv-submit">Submit report</button></div>
    <div class="banner" id="cv-msg"></div>
  </div>
  <div>
    <h2>My civic reports</h2>
    <div class="cases" id="civList"><div class="empty">Loading…</div></div>
  </div>
</section>

<!-- ============ POLICE NEAR ME (MAP) ============ -->
<section class="tabpane" id="t-map">
  <div class="panel maphead">
    <div><h2 style="margin:0">Police stations near me</h2><p class="hint" style="margin:2px 0 0" id="mapNote">Tap “Find nearest” to see the closest stations. Your location stays in your browser.</p></div>
    <div class="mapbtns"><button class="btn primary" id="mapLocate">📍 Find nearest</button><button class="btn" id="mapAll">All stations</button></div>
  </div>
  <div class="mapgrid">
    <div class="mapwrap"><div id="map"></div><div class="maploading" id="mapLoading"><i></i>Loading map…</div></div>
    <div class="maplist">
      <input id="mapSearch" placeholder="Search station or city…" autocomplete="off">
      <div id="mapList" class="mapcards"></div>
    </div>
  </div>
  <div class="hint">Station positions are approximate (neighbourhood level). In an emergency do not wait &mdash; dial <b>112</b>.</div>
</section>

<!-- ============ MY CASES ============ -->
<section class="tabpane" id="t-cases">
  <div>
    <h2>My cases</h2>
    <div class="cases" id="cases"><div class="empty">Loading…</div></div>
  </div>
</section>

<!-- ============ SURAKSHA AI (filled by suraksha-ai.js) ============ -->
<section class="tabpane" id="t-ai"></section>

<!-- ============ REPORT A CONCERN + COMMUNITY (filled by concern-community.js) ============ -->
<section class="tabpane" id="t-concern"></section>
<section class="tabpane" id="t-community"></section>

<!-- ============ SAFETY ACADEMY (filled by sections.js) ============ -->
<section class="tabpane" id="t-law"></section>
<section class="tabpane" id="t-road"></section>
<section class="tabpane" id="t-women"></section>
<section class="tabpane" id="t-rag"></section>

</main>
<div id="reelV"><div class="phone" id="phone"></div></div>
<footer class="foot"><div><b>SurakshaSetu</b> &middot; Citizen safety portal</div><div class="fl"><span>Emergency <a href="tel:112">112</a></span><span>Cyber fraud <a href="tel:1930">1930</a></span><span>Women <a href="tel:1091">1091</a></span><span>Child <a href="tel:1098">1098</a></span></div></footer>
<a class="fabsos" href="tel:112" title="Call 112"><span data-ic="siren"></span> SOS 112</a>
<div class="toast" id="toast"></div>

<script src="app.js"></script>
<script>
/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);

/* ---------- icon set (line icons, no emoji) ---------- */
const IC = {
  bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  laptop:'<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 20h20"/><path d="m10 9-2 2 2 2M14 9l2 2-2 2"/>',
  shield:'<path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  siren:'<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 18h14v3H5z"/><path d="M12 2v2M4.5 6l1.5 1.5M19.5 6 18 7.5"/>',
  card:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chat:'<path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L3.5 20l1.2-4.6A8 8 0 1 1 20.5 11.5Z"/>',
  pin:'<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
  clip:'<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
  zap:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  car:'<path d="M4 17v-5l2-5h12l2 5v5"/><path d="M4 12h16M7 17v2M17 17v2"/>',
  scale:'<path d="M12 4v16M6 20h12M5 7h14"/><path d="m5 7-3 7a3.5 3.5 0 0 0 6 0L5 7ZM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7Z"/>',
  road:'<path d="M8 3 5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3"/>',
  tree:'<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21M9 21h6"/>',
  mega:'<path d="M4 10v4h3l7 4V6L7 10H4Z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  map:'<path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z"/><path d="M9 4v13M15 7v13"/>',
  badge:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="m9.5 8 1.8 1.8 3.2-3.6"/>'
};
const icon = (k, cls) => '<svg class="ico '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[k]||IC.shield)+'</svg>';
const SERVICES = [
  {n:'Theft', ic:'bag', d:'Stolen phone, vehicle, wallet or property'},
  {n:'Cybercrime', ic:'laptop', d:'Hacking, phishing, online abuse'},
  {n:'Assault', ic:'shield', d:'Physical attack or violence'},
  {n:'Missing Person', ic:'search', d:'Child or adult who cannot be found'},
  {n:'Harassment', ic:'ban', d:'Stalking, threats, eve-teasing'},
  {n:'Murder', ic:'siren', d:'Death by violence — report immediately'},
  {n:'Fraud', ic:'card', d:'Cheating, UPI / card / loan scams'},
];
let chosen = '';
function toast(t){ const e=$('toast'); e.textContent=t; e.classList.add('show'); clearTimeout(toast.h); toast.h=setTimeout(()=>e.classList.remove('show'),4500); }
function hhmm(iso){ if(!iso) return ''; const d=new Date(iso); return isNaN(d)?'':d.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}); }
function ini(name){ return (name||'?').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
const todayStr = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };

/* ---------- tabs ---------- */
function show(t){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on', b.dataset.t===t));
  document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('on', p.id==='t-'+t));
  if (location.hash !== '#'+t) history.replaceState(null,'','#'+t);
  if (t==='appt') { loadAppts(); }
  if (t==='chat') { loadStations(); }
  if (t==='cases') { loadCases(); }
  if (t==='civic') { loadCivic(); }
  if (t==='map') { openMap(); }
  if (t==='efir') { loadEfirs(); }
  window.scrollTo({top:0});
}
$('nav').addEventListener('click', e => { const b=e.target.closest('button'); if(b) show(b.dataset.t); });
document.addEventListener('click', e => { const g=e.target.closest('[data-go]'); if(g) show(g.dataset.go); });

/* ---------- greeting ---------- */
function greet(name){
  const h = new Date().getHours();
  const part = h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : 'Good evening';
  $('greet').innerHTML = 'Namaste, <em>' + esc(name) + '</em>.<span class="l2">' + part + ', and welcome to SurakshaSetu.</span>';
}

/* ---------- service cards ---------- */
function svcHTML(withPick){ return SERVICES.map(s => '<button type="button" class="svc" data-svc="'+esc(s.n)+'"><span class="ic">'+icon(s.ic)+'</span><b>'+esc(s.n)+'</b><span>'+esc(s.d)+'</span></button>').join(''); }
$('services').innerHTML = svcHTML();
$('fileServices').innerHTML = svcHTML();
$('f-cat').innerHTML += SERVICES.map(s=>'<option>'+esc(s.n)+'</option>').join('');
$('services').addEventListener('click', e => { const b=e.target.closest('.svc'); if(b){ show('file'); pick(b.dataset.svc); $('description').focus(); } });
$('fileServices').addEventListener('click', e => { const b=e.target.closest('.svc'); if(b) pick(b.dataset.svc); });

/* ---------- live Minor / Major / Critical preview (mirrors SeverityClassifier.java) ---------- */
const CRIT = ['murder','killed','death','weapon','gun','knife','rape','child abuse','kidnap','life threat','acid attack'];
const MAJOR = ['hacked','fraud','robbery','assault','threat','blackmail','burglary','extortion','unauthorized transaction'];
const SEV_BASE = {'cybercrime':'Major','murder':'Critical','fraud':'Major','assault':'Major','missing person':'Critical','theft':'Minor','harassment':'Minor'};
function classifyText(cat, text){
  const d = (text||'').toLowerCase();
  let k = CRIT.find(w=>d.includes(w)); if (k) return {sev:'Critical', why:'Mentions “'+k+'”'};
  k = MAJOR.find(w=>d.includes(w));    if (k) return {sev:'Major', why:'Mentions “'+k+'”'};
  return {sev: SEV_BASE[(cat||'').toLowerCase()] || 'Minor', why:'Default for '+(cat||'this type of case')};
}
function classify(){
  const box = $('sev'), txt = $('description').value;
  if (!chosen) { box.innerHTML = '<span class="hint">Choose a case type and start describing — the priority appears here.</span>'; return; }
  const r = classifyText(chosen, txt);
  box.innerHTML = '<span class="tag '+r.sev+'">'+r.sev+' priority</span><span class="why">'+esc(r.why)+'. This is an estimate; the final priority is set when you submit.</span>';
}
$('description').addEventListener('input', () => { $('count').textContent = $('description').value.trim().length; classify(); });

/* ---------- e-FIR ---------- */
$('f-date').max = todayStr();
$('f-submit').addEventListener('click', async () => {
  const body = { category:$('f-cat').value, incidentDate:$('f-date').value, incidentTime:$('f-time').value, place:$('f-place').value.trim(),
    description:$('f-desc').value.trim(), accused:$('f-accused').value.trim(), witnesses:$('f-wit').value.trim(), declare: $('f-decl').checked ? 'yes' : 'no' };
  if (!body.category) return banner('f-msg', false, 'Please choose the offence type.');
  if (!body.incidentDate) return banner('f-msg', false, 'Please enter the date of the incident.');
  if (body.place.length < 3) return banner('f-msg', false, 'Please enter where it happened.');
  if (body.description.length < 20) return banner('f-msg', false, 'Please describe the incident (at least 20 characters).');
  if (!$('f-decl').checked) return banner('f-msg', false, 'Please tick the declaration.');
  $('f-submit').disabled = true;
  const r = await post('/api/efir', body);
  $('f-submit').disabled = false;
  banner('f-msg', r.ok, r.data.message || 'Could not submit the e-FIR.');
  if (r.ok) { ['f-desc','f-place','f-accused','f-wit','f-time'].forEach(i=>$(i).value=''); $('f-cat').value=''; $('f-date').value=''; $('f-decl').checked=false; loadEfirs(); }
});
async function loadEfirs(){
  const r = await api('/api/efir'); if (!r.ok) return;
  $('efirs').innerHTML = r.data.length ? r.data.map(e =>
    '<div class="card"><div class="top"><b class="num">'+esc(e.firNumber)+'</b><span class="tag '+esc(e.severity)+'">'+esc(e.severity)+'</span></div>'+
    '<div class="meta">'+esc(e.category)+' &middot; '+esc(e.incidentDate)+(e.incidentTime?' '+esc(e.incidentTime):'')+' &middot; '+esc(e.place)+'</div>'+
    '<p>'+esc(e.description)+'</p><div class="meta">Linked to Case #'+e.complaintId+' &middot; filed '+esc(hhmm(e.filedAt))+'</div></div>').join('')
    : '<div class="empty">You have not registered any e-FIR yet.</div>';
}

/* ---------- my cases ---------- */
async function loadCases(){
  const r = await api('/api/complaints'); const box = $('cases');
  if (!r.ok) return;
  if (!r.data.length) { box.innerHTML = '<div class="empty">You have not filed any complaints yet.</div>'; return; }
  box.innerHTML = r.data.map(c => {
    let note = '';
    if (c.status === 'Pending') note = '<div class="meta" style="margin-top:8px">Waiting for the admin to assign an officer.</div>';
    else if (c.status.indexOf('Awaiting') >= 0) note = '<div class="meta" style="margin-top:8px">An officer has been assigned and will respond shortly.</div>';
    else if (c.status === 'Under Investigation') note = '<div class="meta" style="margin-top:8px">Your case is registered. Waiting for further enquiry.</div>';
    return caseCard(c, note, false);
  }).join('');
}

/* ---------- news ---------- */
let newsItems = [], newsRegion = 'All';
async function loadNews(){
  const r = await api('/api/news'); if (!r.ok) { $('news').innerHTML='<div class="empty">Could not load news.</div>'; return; }
  newsItems = r.data.items || [];
  $('newsNote').textContent = r.data.live ? 'Headlines from Google News, refreshed every 15 minutes.' : 'Live news is unavailable right now, showing safety tips instead.';
  renderNews();
}
$('newsSeg').addEventListener('click', e => { const b=e.target.closest('button'); if(!b) return;
  newsRegion=b.dataset.r; document.querySelectorAll('#newsSeg button').forEach(x=>x.classList.toggle('on',x===b)); renderNews(); });

/* ---------- stations (shared by appointments + chat) ---------- */
let stations = [];
async function ensureStations(){
  if (stations.length) return;
  const r = await api('/api/stations'); if (r.ok) stations = r.data;
}
async function loadStationSelect(){
  await ensureStations();
  $('a-station').innerHTML = '<option value="">Choose a station…</option>' + stations.map(s =>
    '<option value="'+s.officerId+'">'+esc(s.station)+' — '+esc(s.name)+' ('+esc(s.specialization)+', '+esc(s.city)+')</option>').join('');
}

/* ---------- appointments ---------- */
$('a-date').min = todayStr();
let lastStatus = null;
$('a-submit').addEventListener('click', async () => {
  const body = { officerId:$('a-station').value, purpose:$('a-purpose').value, date:$('a-date').value, time:$('a-time').value };
  if (!body.officerId) return banner('a-msg', false, 'Please choose a police station.');
  if (!body.purpose) return banner('a-msg', false, 'Please choose a purpose.');
  if (!body.date) return banner('a-msg', false, 'Please pick a date.');
  if (!body.time) return banner('a-msg', false, 'Please pick a time.');
  $('a-submit').disabled = true;
  const r = await post('/api/appointments', body);
  $('a-submit').disabled = false;
  banner('a-msg', r.ok, r.data.message || 'Could not book the appointment.');
  if (r.ok) { $('a-purpose').value=''; loadAppts(); }
});
async function loadAppts(){
  await loadStationSelect();
  const r = await api('/api/appointments'); if (!r.ok) return;
  // tell the citizen when an officer answers while they are on the page
  const now = {}; r.data.forEach(a => now[a.appointmentId] = a.status);
  if (lastStatus) r.data.forEach(a => { if (lastStatus[a.appointmentId]==='Pending' && a.status!=='Pending') toast('Appointment #'+a.appointmentId+' at '+a.station+' was '+a.status.toLowerCase()+'.'); });
  lastStatus = now;
  $('appts').innerHTML = r.data.length ? r.data.map(a =>
    '<div class="card appt"><div class="row"><b>'+esc(a.station)+'</b><span class="chip '+esc(a.status)+'">'+(a.status==='Pending'?'⏳ Awaiting response':a.status==='Accepted'?'✔ Accepted':'✖ Declined')+'</span></div>'+
    '<div class="meta">With '+esc(a.officerName)+' &middot; '+esc(a.purpose)+'</div>'+
    '<div>📅 <b>'+esc(a.date)+'</b> at <b>'+esc(a.time)+'</b></div>'+
    (a.note?'<div class="reply"><b>Officer’s note:</b> '+esc(a.note)+'</div>':'')+
    (a.status==='Accepted'?'<div class="hint">Please carry a valid photo ID.</div>':'')+'</div>').join('')
    : '<div class="empty">No appointments yet.</div>';
}

/* ---------- chat ---------- */
let activeOfficer = null, chatTimer = null;
async function loadStations(){
  await ensureStations();
  $('stations').innerHTML = stations.length ? stations.map(s =>
    '<div class="conv'+(activeOfficer===s.officerId?' on':'')+'" data-o="'+s.officerId+'"><div class="av blue">'+esc(ini(s.station))+'</div>'+
    '<div class="t"><b>'+esc(s.station)+(s.nearby?'<span class="near">NEARBY</span>':'')+'</b><span>'+esc(s.name)+' · '+esc(s.specialization)+'</span></div></div>').join('')
    : '<div class="empty">No stations found.</div>';
}
$('stations').addEventListener('click', e => { const c=e.target.closest('.conv'); if(c) openThread(parseInt(c.dataset.o,10)); });
async function openThread(id){
  activeOfficer = id;
  const s = stations.find(x=>x.officerId===id); if(!s) return;
  $('msgBox').classList.add('open');
  $('thread').innerHTML = '<div class="head"><button class="btn back" id="back">←</button><div class="av blue">'+esc(ini(s.station))+'</div><div><b>'+esc(s.station)+'</b><div class="meta">'+esc(s.name)+' · '+esc(s.specialization)+' · '+esc(s.city)+' · 📞 '+esc(s.contactNumber)+'</div></div></div>'+
    '<div class="body" id="tbody"><div class="nothread">Loading…</div></div>'+
    '<form id="tform"><input id="tinput" placeholder="Write a message…" autocomplete="off" maxlength="1000"><button class="btn primary" type="submit">Send</button></form>';
  $('back').onclick = () => { $('msgBox').classList.remove('open'); activeOfficer=null; clearInterval(chatTimer); loadStations(); };
  $('tform').onsubmit = async ev => {
    ev.preventDefault(); const t=$('tinput').value.trim(); if(!t) return;
    $('tinput').value='';
    const r = await post('/api/chat', { officerId:id, text:t });
    if(!r.ok) toast(r.data.message||'Message not sent.');
    refreshThread(true);
  };
  loadStations(); await refreshThread(true);
  clearInterval(chatTimer); chatTimer = setInterval(() => refreshThread(false), 4000);
}
let lastCount = 0;
async function refreshThread(force){
  if (activeOfficer===null) return;
  const r = await api('/api/chat?officerId='+activeOfficer); if(!r.ok) return;
  const body = $('tbody'); if(!body) return;
  if (!force && r.data.length === lastCount) return;
  lastCount = r.data.length;
  body.innerHTML = r.data.length ? r.data.map(m => '<div class="bub '+(m.sender==='user'?'me':'them')+'">'+esc(m.text)+'<small>'+esc(hhmm(m.time))+'</small></div>').join('')
    : '<div class="nothread">Say hello and describe your concern.<br><span class="hint">For emergencies, dial 112.</span></div>';
  body.scrollTop = body.scrollHeight;
}


/* ================= v3: creative home ================= */
const TRUST_MSGS = [['check','<b>Free</b> to use'],['lock','Your details stay <b>private</b>'],['clock','<b>24×7</b> online filing'],['pin','<b>Track</b> your case live'],['badge','Matched to the <b>right officer</b>'],['phone','Emergency? Dial <b>112</b>'],['card','Cyber fraud? Call <b>1930</b> quickly'],['receipt','Every complaint gets a <b>case number</b>']];
$('ticker').innerHTML = [0,1].map(()=>TRUST_MSGS.map(m=>'<span>'+icon(m[0],'tk')+'<span>'+m[1]+'</span></span>').join('')).join('');

/* ----- promo carousel: our own service ads ----- */
const PROMOS = [
  {bg:'linear-gradient(120deg,#4a1763,#ff5c8a)', k:'NEW · e-FIR', h:'Register an e-FIR in minutes', p:'No station visit to start. Add details, submit, and get a reference number instantly.', b:'Start e-FIR', go:'efir', art:'file'},
  {bg:'linear-gradient(120deg,#0e2470,#4c7dff)', k:'SKIP THE QUEUE', h:'Book a police appointment', p:'Pick a station, date and time. You will see the moment an officer accepts.', b:'Book now', go:'appt', art:'calendar'},
  {bg:'linear-gradient(120deg,#08485a,#1fc7b0)', k:'TALK TO POLICE', h:'Chat with your nearest station', p:'Describe your problem and get guidance from an officer.', b:'Open chat', go:'chat', art:'chat'},
  {bg:'linear-gradient(120deg,#6b2d00,#ff9a3d)', k:'CYBER FRAUD?', h:'Act fast, report fast', p:'Lost money online? Call 1930 and file a complaint here right away.', b:'Report fraud', go:'file', art:'card', svc:'Fraud'},
  {bg:'linear-gradient(120deg,#2b1a6e,#9b7bff)', k:'ALWAYS INFORMED', h:'Track every case live', p:'Pending, assigned, accepted — see each step without calling anyone.', b:'My cases', go:'cases', art:'pin'},
];
let pi = 0, pTimer;
$('promo').innerHTML = '<span class="adtag">FEATURED</span>' + PROMOS.map((x,i)=>
  '<div class="slide'+(i===0?' on':'')+'" style="background:'+x.bg+'"><div class="tx"><div class="kick">'+x.k+'</div><h3>'+x.h+'</h3><p>'+x.p+'</p><button class="btn" data-pgo="'+i+'">'+x.b+' →</button></div><div class="art"><i class="rg1"></i><i class="rg2"></i>'+icon(x.art)+'</div><i class="pbar"></i></div>').join('')
  + '<div class="dots">'+PROMOS.map((_,i)=>'<i data-d="'+i+'" class="'+(i===0?'on':'')+'"></i>').join('')+'</div>';
function promoShow(n){
  pi = (n+PROMOS.length)%PROMOS.length;
  document.querySelectorAll('#promo .slide').forEach((e,i)=>e.classList.toggle('on',i===pi));
  document.querySelectorAll('#promo .dots i').forEach((e,i)=>e.classList.toggle('on',i===pi));
}
function promoRun(){ clearInterval(pTimer); pTimer = setInterval(()=>promoShow(pi+1), 5200); }
$('promo').addEventListener('click', e => {
  const d=e.target.closest('[data-d]'); if(d){ promoShow(+d.dataset.d); promoRun(); return; }
  const g=e.target.closest('[data-pgo]'); if(g){ const x=PROMOS[+g.dataset.pgo]; show(x.go); if(x.svc) pick(x.svc); }
});
$('promo').addEventListener('mouseenter',()=>clearInterval(pTimer)); $('promo').addEventListener('mouseleave',promoRun);
promoRun();

/* ----- safety reels (Instagram-style stories) -----
   To add your own VIDEO reel: put an .mp4 in src/main/webapp/media/ and add  video:'media/yourfile.mp4'  to an entry. */
const REELS = [
  {t:'Cyber fraud: the first hour', video:'media/reel1.mp4', poster:'media/reel1.jpg', e:'💳', bg:'linear-gradient(160deg,#0f3d91,#07101E)', h:'Lost money online?', p:'Call 1930 as soon as you can and keep screenshots, transaction IDs and the scammer’s number. Then file your case here.', b:'Report fraud', go:'file', svc:'Fraud'},
  {t:'Never share your OTP', video:'media/reel2.mp4', poster:'media/reel2.jpg', e:'🔐', bg:'linear-gradient(160deg,#5a3a00,#0B1220)', h:'OTP = your money', p:'Banks, police and delivery staff never need your OTP, PIN or CVV. If someone asks, it is a scam.', b:'Learn & report', go:'file', svc:'Cybercrime'},
  {t:'Women’s safety', video:'media/reel3.mp4', poster:'media/reel3.jpg', e:'👩', bg:'linear-gradient(160deg,#5b2a86,#0B1220)', h:'You are not alone', p:'In danger? Call 112 or the women helpline 1091. For harassment or stalking, report it here and keep any messages as proof.', b:'Report harassment', go:'file', svc:'Harassment'},
  {t:'Missing person: act fast', video:'media/reel4.mp4', poster:'media/reel4.jpg', e:'🔍', bg:'linear-gradient(160deg,#7a3b00,#0B1220)', h:'Do not wait', p:'Report a missing person immediately. Share a recent photo, clothing, and the last place seen. Children: call 1098 or 112.', b:'Report missing', go:'file', svc:'Missing Person'},
  {t:'Phone or bag stolen', video:'media/reel5.mp4', poster:'media/reel5.jpg', e:'👜', bg:'linear-gradient(160deg,#0b5a3a,#0B1220)', h:'Stolen something?', p:'Note the time, place and details of the item. For a phone, keep its IMEI/bill handy. File online and book a visit if needed.', b:'Report theft', go:'file', svc:'Theft'},
  {t:'Know your FIR rights', video:'media/reel6.mp4', poster:'media/reel6.jpg', e:'⚖️', bg:'linear-gradient(160deg,#7a1f1f,#0B1220)', h:'Your right to report', p:'You can approach any police station to report a serious offence, and you are entitled to a copy of your FIR. Ask politely, note the officer’s name.', b:'Register e-FIR', go:'efir'},
];
$('reels').innerHTML = REELS.map((r,i)=>'<button class="reelc" data-r="'+i+'" style="background:'+r.bg+'"><span class="ring">REEL</span><span class="play">▶</span>'+
  (r.poster ? '<img class="pst" src="'+esc(r.poster)+'" alt="'+esc(r.t)+'" loading="lazy" onerror="this.remove()">' : '<span class="em">'+(r.e)+'</span><span class="cap">'+esc(r.t)+'</span>')+'</button>').join('');
let ri = -1, rTimer;
const RDUR = 6500;
function reelOpen(i){ ri=i; $('reelV').classList.add('on'); document.body.style.overflow='hidden'; reelRender(); }
function reelClose(){ clearTimeout(rTimer); $('reelV').classList.remove('on'); document.body.style.overflow=''; $('phone').innerHTML=''; ri=-1; }
function reelGo(n){ if (n<0) n=0; if (n>=REELS.length) return reelClose(); ri=n; reelRender(); }
function reelRender(){
  clearTimeout(rTimer);
  const r = REELS[ri], dur = r.video ? 10000 : RDUR;
  $('phone').style.background = r.bg;
  $('phone').innerHTML =
    '<div class="bars">'+REELS.map((_,i)=>'<i class="'+(i<ri?'done':'')+'"><b></b></i>').join('')+'</div>'+
    '<div class="top"><div class="av">SS</div>SurakshaSetu Safety<button id="rx" aria-label="Close">×</button></div>'+
    (r.video ? '<video src="'+esc(r.video)+'" poster="'+esc(r.poster||'')+'" autoplay muted playsinline></video>' : '')+
    '<div class="stage'+(r.video?' vid':'')+'">'+(r.video?'':'<div class="big">'+r.e+'</div><h3>'+esc(r.h)+'</h3><p>'+esc(r.p)+'</p>')+'<button class="btn" id="rgo">'+esc(r.b)+' →</button></div>'+
    '<div class="zl" id="rl"></div><div class="zr" id="rr"></div>';
  $('rx').onclick = reelClose; $('rl').onclick = () => reelGo(ri-1); $('rr').onclick = () => reelGo(ri+1);
  $('rgo').onclick = () => { reelClose(); show(r.go); if (r.svc) pick(r.svc); };
  const bar = $('phone').querySelectorAll('.bars i')[ri];
  bar.classList.add('run'); const bb = bar.firstElementChild; bb.style.width='0'; bb.style.transitionDuration = dur+'ms';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ bb.style.width='100%'; }));
  const vEl = $('phone').querySelector('video'); if (vEl) { vEl.play().catch(()=>{}); vEl.onended = () => reelGo(ri+1); }
  rTimer = setTimeout(()=>reelGo(ri+1), dur + 400);
}
$('reels').addEventListener('click', e => { const c=e.target.closest('.reelc'); if(c) reelOpen(+c.dataset.r); });
$('reelV').addEventListener('click', e => { if (e.target.id==='reelV') reelClose(); });
document.addEventListener('keydown', e => { if (ri<0) return; if(e.key==='Escape') reelClose(); if(e.key==='ArrowRight') reelGo(ri+1); if(e.key==='ArrowLeft') reelGo(ri-1); });

/* ----- news as picture cards (LinkedIn-style reactions) ----- */
function theme(title){
  const t=(title||'').toLowerCase();
  const T=[
    [/cyber|fraud|scam|online|digital|phish|upi|hack/,'laptop','linear-gradient(135deg,#0f3d91,#3A86FF)'],
    [/drug|ganja|narcotic|mdma|cocaine|smuggl/,'ban','linear-gradient(135deg,#0b5a3a,#3DBE7A)'],
    [/woman|women|girl|harass|stalk|domestic/,'users','linear-gradient(135deg,#5b2a86,#c084fc)'],
    [/traffic|accident|vehicle|drunk|helmet|signal|speeding/,'car','linear-gradient(135deg,#7a4a00,#F4A300)'],
    [/murder|kill|stab|shot|attack|assault|robber/,'siren','linear-gradient(135deg,#7a1f1f,#E5534B)'],
    [/arrest|raid|held|nabbed|custody|accused|gang|busted/,'badge','linear-gradient(135deg,#1B2A41,#3A86FF)'],
    [/missing|kidnap|child|rescue/,'search','linear-gradient(135deg,#7a3b00,#fb923c)'],
    [/court|law|bill|act|government|minister|policy|mha|home ministry/,'scale','linear-gradient(135deg,#243b55,#6b7fa8)'],
  ];
  for (const [re,e,g] of T) if (re.test(t)) return {e,g};
  return {e:'shield', g:'linear-gradient(135deg,#1B2A41,#2f4a73)'};
}
const liked = JSON.parse(localStorage.getItem('ss_liked')||'{}');
function ncardHTML(n, big, idx){
  const th = theme(n.title), d = n.date ? new Date(n.date) : null;
  const key = (n.link||n.title).slice(-60);
  const when = d && !isNaN(d) ? d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '';
  const inner = '<div class="thumb'+(big?' big':'')+(n.image?' hasimg':'')+'" style="background:'+th.g+'">'+
      (n.image ? '<img src="'+esc(n.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove(\'hasimg\');this.remove()">' : '')+
      '<span class="rg">'+esc(n.region)+'</span><span class="em">'+icon(th.e)+'</span></div>'+
    '<div class="nb"><b>'+esc(n.title)+'</b><div class="nm">'+esc(n.source||'')+(when?' · '+esc(when):'')+'</div></div>';
  const react = '<div class="react"><button data-like="'+esc(key)+'" class="'+(liked[key]?'on':'')+'">'+(liked[key]?'👍 Liked':'👍 Like')+'</button>'+
    (n.link?'<button data-share="'+idx+'">↗ Share</button>':'')+'</div>';
  // the card itself is a div so the reaction buttons are not nested inside a link
  return '<div class="ncard">'+(n.link?'<a href="'+esc(n.link)+'" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;display:flex;flex-direction:column;flex:1">'+inner+'</a>':'<div style="display:flex;flex-direction:column;flex:1">'+inner+'</div>')+'<div style="padding:0 14px 10px">'+react+'</div></div>';
}
function renderNews(){
  const list = newsItems.filter(n => newsRegion==='All' || n.region===newsRegion);
  if (!list.length) { $('news').innerHTML='<div class="empty">No headlines for this filter.</div>'; return; }
  const feat = list.slice(0,2), rest = list.slice(2);
  $('news').innerHTML = '<div class="nfeat">'+ncardHTML(feat[0],true,newsItems.indexOf(feat[0]))+(feat[1]?ncardHTML(feat[1],true,newsItems.indexOf(feat[1])):'')+'</div>'+
    (rest.length?'<div class="nrail">'+rest.map(n=>ncardHTML(n,false,newsItems.indexOf(n))).join('')+'</div>':'');
}
$('news').addEventListener('click', e => {
  const l = e.target.closest('[data-like]');
  if (l) { const k=l.dataset.like; liked[k] = !liked[k]; if(!liked[k]) delete liked[k]; try{localStorage.setItem('ss_liked',JSON.stringify(liked));}catch(_){}
    l.classList.toggle('on', !!liked[k]); l.textContent = liked[k] ? '👍 Liked' : '👍 Like'; return; }
  const s = e.target.closest('[data-share]');
  if (s) { const n=newsItems[+s.dataset.share]; if(!n) return;
    if (navigator.share) navigator.share({title:n.title,url:n.link}).catch(()=>{});
    else if (navigator.clipboard) navigator.clipboard.writeText(n.link).then(()=>toast('Link copied.')); }
});

/* ----- live chat preview ----- */
const DEMO = [['me','Hello sir, my phone was stolen near the market.'],['them','Namaste. Sorry to hear that. When did it happen?'],['me','Around 6 pm today.'],['them','Please file an e-FIR here and visit us with your ID. We will help.']];
let demoTimer, demoOn = false;
function runDemo(){
  const box = $('mock'); if (demoOn) return; demoOn = true;
  const head = '<div class="mh"><div class="av blue">PS</div><div><b>Nearby Police Station</b><div class="meta">● Online</div></div></div>';
  box.innerHTML = head; let i = 0;
  (function step(){
    if (!document.body.contains(box)) return;
    if (i >= DEMO.length) { demoTimer = setTimeout(()=>{ box.innerHTML = head; i = 0; step(); }, 4500); return; }
    const [w, t] = DEMO[i];
    if (w === 'them') { box.insertAdjacentHTML('beforeend','<div class="typing" id="ty"><i></i><i></i><i></i></div>'); demoTimer = setTimeout(()=>{ const ty=$('ty'); if(ty) ty.remove(); box.insertAdjacentHTML('beforeend','<div class="bub them">'+esc(t)+'</div>'); i++; demoTimer=setTimeout(step,1300); }, 1400); }
    else { box.insertAdjacentHTML('beforeend','<div class="bub me">'+esc(t)+'</div>'); i++; demoTimer = setTimeout(step, 1300); }
  })();
}

/* ----- scroll reveal + count-up ----- */
function countUp(el){
  const to = +el.dataset.count, suf = el.dataset.suffix||''; const t0 = performance.now(), D = 1200;
  (function f(t){ const k=Math.min(1,(t-t0)/D); el.textContent = Math.round(to*(1-Math.pow(1-k,3))) + suf; if(k<1) requestAnimationFrame(f); })(t0);
}
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in'); io.unobserve(en.target);
  en.target.querySelectorAll('[data-count]').forEach(countUp);
  if (en.target.id === 'chatdemo') runDemo();
}), {threshold:.15});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ================= File-a-case wizard ================= */
const PLATFORMS = ['WhatsApp','Instagram','Facebook','Telegram','X (Twitter)','YouTube','Email','SMS / phone call','Banking or UPI app','Shopping / marketplace site','Loan or job app','Other website or app'];
const PAYMENTS = ['UPI','Debit card','Credit card','Net banking','Wallet','Cash / in person','Cheque','Other'];
const FILE_ICON = {jpg:'🖼️',jpeg:'🖼️',png:'🖼️',webp:'🖼️',gif:'🖼️',pdf:'📄',eml:'✉️',txt:'📝',csv:'📊',docx:'📃',xlsx:'📊'};
const MAXF = 6, MAXB = 5*1024*1024;
$('platform').innerHTML += PLATFORMS.map(p=>'<option>'+esc(p)+'</option>').join('');
$('payMethod').innerHTML += PAYMENTS.map(p=>'<option>'+esc(p)+'</option>').join('');
$('incDate').max = todayStr(); $('txnDate').max = todayStr();

let step = 1, hasLoss = null, lossTouched = false, files = [], fileSeq = 0, sending = false;
function flag(id){ const e=$(id); if(!e) return; e.classList.add('bad-f'); e.focus(); setTimeout(()=>e.classList.remove('bad-f'),1200); }

/* ---- case type (also called from the home page cards, promos and reels) ---- */
function pick(n){
  if (n && !$('done').hidden) resetWizard();
  chosen = n;
  document.querySelectorAll('#fileServices .svc').forEach(b=>b.classList.toggle('on', b.dataset.svc===n));
  $('f-cat').value = n;
  classify();
  if (!lossTouched) setLoss(n==='Fraud' ? true : null, false);
}

/* ---- step 2: money lost? ---- */
function setLoss(v, touched){
  hasLoss = v; if (touched) lossTouched = true;
  document.querySelectorAll('#lossYN button').forEach(b=>b.classList.toggle('on', v!==null && b.dataset.v===(v?'yes':'no')));
  $('finFields').classList.toggle('on', v===true);
  $('naFin').classList.toggle('on', v===false);
  $('lossTip').style.display = (v===true || chosen==='Fraud' || chosen==='Cybercrime') ? 'block' : 'none';
}
$('lossYN').addEventListener('click', e => { const b=e.target.closest('button'); if(b) setLoss(b.dataset.v==='yes', true); });
setLoss(null, false);

/* ---- step 3: evidence ---- */
async function fileProblem(file){
  const ext = (file.name.split('.').pop()||'').toLowerCase();
  if (!FILE_ICON[ext]) return 'This file type is not allowed.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAXB) return 'Larger than 5 MB ('+fsize(file.size)+').';
  const b = new Uint8Array(await file.slice(0,4096).arrayBuffer());
  const eq = a => a.every((v,i)=>b[i]===v);
  const ok = {
    jpg:()=>eq([0xFF,0xD8,0xFF]), jpeg:()=>eq([0xFF,0xD8,0xFF]), png:()=>eq([0x89,0x50,0x4E,0x47]), gif:()=>eq([0x47,0x49,0x46,0x38]),
    webp:()=>eq([0x52,0x49,0x46,0x46]) && eq([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50].map((v,i)=>i>=4&&i<8?b[i]:v)),
    pdf:()=>eq([0x25,0x50,0x44,0x46]), docx:()=>eq([0x50,0x4B,3,4]), xlsx:()=>eq([0x50,0x4B,3,4]),
  }[ext];
  if (ok) return ok() ? '' : 'This file does not look like a real .'+ext+' file.';
  return Array.prototype.indexOf.call(b,0) >= 0 ? 'This does not look like a text file.' : '';
}
async function addFiles(list){
  for (const file of list) {
    if (files.some(f=>f.status!=='bad' && f.file.name===file.name && f.file.size===file.size && f.file.lastModified===file.lastModified)) { toast('“'+file.name+'” is already added.'); continue; }
    const item = { id:++fileSeq, file, status:'checking', reason:'', url:'' };
    if (/\.(jpe?g|png|webp|gif)$/i.test(file.name)) item.url = URL.createObjectURL(file);
    files.push(item); renderFiles();
    const t0 = Date.now();
    let why = files.filter(f=>f.status==='ok').length >= MAXF ? 'You can attach up to '+MAXF+' files.' : await fileProblem(file);
    await new Promise(r=>setTimeout(r, Math.max(0, 450-(Date.now()-t0))));   // let the "checking" shimmer be seen
    item.status = why ? 'bad' : 'ok'; item.reason = why; renderFiles();
  }
}
function renderFiles(){
  $('flist').innerHTML = files.map(f => {
    const ext = (f.file.name.split('.').pop()||'').toLowerCase();
    const st = f.status==='checking' ? '<span class="fst checking">Checking…</span>' : f.status==='ok' ? '<span class="fst ok">✔ Ready to attach</span>' : f.status==='sent' ? '<span class="fst sent">✔ Attached</span>' : '<span class="fst bad">✖ Not attached</span>';
    return '<div class="fitem '+f.status+'"><div class="th"'+(f.url?' style="background-image:url(\''+esc(f.url)+'\')"':'')+'>'+(f.url?'':(FILE_ICON[ext]||'📎'))+'</div>'+
      '<div class="fi"><b>'+esc(f.file.name)+'</b><small>'+fsize(f.file.size)+'</small>'+(f.reason?'<span class="why">'+esc(f.reason)+'</span>':'')+'</div>'+st+
      '<button type="button" class="rm" data-rm="'+f.id+'" aria-label="Remove">×</button></div>';
  }).join('');
  const ok = files.filter(f=>f.status==='ok'||f.status==='sent').length, bad = files.filter(f=>f.status==='bad').length;
  $('fsum').innerHTML = !files.length ? 'No files yet. You can submit without files, but screenshots and receipts help the police a lot.'
    : '<b>'+ok+' of '+MAXF+'</b> files ready to attach'+(bad?' · <span style="color:#ff9b95">'+bad+' file'+(bad>1?'s were':' was')+' not accepted and will not be sent</span>':'')+'.';
}
$('flist').addEventListener('click', e => { const r=e.target.closest('[data-rm]'); if(!r) return;
  const i = files.findIndex(f=>f.id===+r.dataset.rm); if (i<0) return; if (files[i].url) URL.revokeObjectURL(files[i].url); files.splice(i,1); renderFiles(); });
const drop = $('drop');
drop.addEventListener('click', e => { if (!e.target.closest('button')) $('fileIn').click(); });
drop.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); $('fileIn').click(); } });
$('pickBtn').addEventListener('click', () => $('fileIn').click());
$('camBtn').addEventListener('click', () => $('camIn').click());
['dragenter','dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => addFiles(Array.from(e.dataTransfer.files||[])));
['fileIn','camIn'].forEach(id => $(id).addEventListener('change', e => { addFiles(Array.from(e.target.files)); e.target.value=''; }));
window.addEventListener('dragover', e => e.preventDefault()); window.addEventListener('drop', e => e.preventDefault());
renderFiles();

/* ---- step 4: review ---- */
function row(k, v, full){ return v ? '<div'+(full?' class="full"':'')+'><span>'+k+'</span><b>'+esc(v)+'</b></div>' : ''; }
function buildReview(){
  const desc = $('description').value.trim(), sevr = classifyText(chosen, desc);
  const when = $('incDate').value + ($('incTime').value ? ' at '+$('incTime').value : '');
  const place = [$('location').value.trim(), $('city').value.trim(), $('state').value.trim()].filter(Boolean).join(', ');
  const sec = (title, n, body) => '<div class="rv"><div class="rh">'+title+'<button type="button" data-e="'+n+'">Edit</button></div><div class="rb">'+body+'</div></div>';
  let h = sec('Incident', 1, row('Case type',chosen)+row('Expected priority',sevr.sev)+row('Date &amp; time',when)+row('Platform',$('platform').value)+row('Identifiers',$('identifiers').value.trim())+row('Description',desc,true));
  h += sec('Location', 1, row('Place',place,true)+row('Police station / jurisdiction',$('juris').value.trim()));
  h += hasLoss ? sec('Financial details', 2, row('Amount lost','₹ '+$('amount').value.trim())+row('Payment method',$('payMethod').value)+row('Bank / provider',$('bank').value.trim())+row('Transaction reference',$('txnRef').value.trim())+row('Transaction date',$('txnDate').value)+row('Paid to',$('payee').value.trim()))
                : sec('Financial details', 2, '<div class="full"><b>No money lost</b></div>');
  const ok = files.filter(f=>f.status==='ok');
  h += sec('Evidence ('+ok.length+')', 3, ok.length ? '<div class="thumbs">'+ok.map(f=>'<span><i'+(f.url?' style="background-image:url(\''+esc(f.url)+'\')"':'')+'>'+(f.url?'':(FILE_ICON[(f.file.name.split('.').pop()||'').toLowerCase()]||'📎'))+'</i>'+esc(f.file.name)+' · '+fsize(f.file.size)+'</span>').join('')+'</div>' : '<div class="full"><b>No files attached</b></div>');
  $('review').innerHTML = h;
}
$('review').addEventListener('click', e => { const b=e.target.closest('[data-e]'); if (b) goStep(+b.dataset.e, true); });

/* ---- navigation + validation ---- */
function validate(n){
  if (n===1) {
    if (!chosen) return 'Please choose a type of case.';
    const d = $('incDate').value, t = $('incTime').value;
    if (!d) { flag('incDate'); return 'Please enter the date of the incident.'; }
    if (d > todayStr()) { flag('incDate'); return 'The incident date cannot be in the future.'; }
    if (t && d===todayStr()) { const now=new Date(), hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'); if (t > hm) { flag('incTime'); return 'The incident time cannot be in the future.'; } }
    if ($('description').value.trim().length < 10) { flag('description'); return 'Please describe what happened (at least 10 characters).'; }
    if ($('location').value.trim().length < 3) { flag('location'); return 'Please tell us where it happened.'; }
  }
  if (n===2) {
    if (hasLoss === null) return 'Please tell us whether you lost money.';
    if (hasLoss) {
      if (!/^\d+(\.\d{1,2})?$/.test($('amount').value.replace(/,/g,'').trim()) || parseFloat($('amount').value.replace(/,/g,'')) <= 0) { flag('amount'); return 'Please enter the amount lost as a number, e.g. 25000.'; }
      if (!$('payMethod').value) { flag('payMethod'); return 'Please choose how the payment was made.'; }
      if ($('txnDate').value > todayStr()) { flag('txnDate'); return 'The transaction date cannot be in the future.'; }
    }
  }
  if (n===3 && files.some(f=>f.status==='checking')) return 'Please wait a moment while your files are checked.';
  if (n===4 && !$('confirm').checked) return 'Please tick the confirmation to submit your complaint.';
  return '';
}
function goStep(n, back){
  step = n; $('msg').className = 'banner';
  document.querySelectorAll('#wiz .step').forEach(s => { s.classList.toggle('on', s.id==='s'+n); s.classList.toggle('back', !!back); });
  document.querySelectorAll('#steps li').forEach(li => { const k=+li.dataset.s; li.classList.toggle('on',k===n); li.classList.toggle('done',k<n); });
  $('wbar').style.width = (n/4*100)+'%';
  $('wBack').hidden = n===1;
  $('wNext').textContent = n===4 ? '🔒 Submit securely' : 'Continue →';
  if (n===4) buildReview();
  $('wiz').scrollIntoView({behavior:'smooth', block:'start'});
}
$('wNext').addEventListener('click', () => { if (sending) return; const err = validate(step); if (err) return banner('msg', false, err); if (step<4) goStep(step+1); else submitCase(); });
$('wBack').addEventListener('click', () => { if (step>1) goStep(step-1, true); });
$('steps').addEventListener('click', e => { const li=e.target.closest('li'); if (li && li.classList.contains('done')) goStep(+li.dataset.s, true); });
goStep(1);

/* ---- submit (multipart, with real upload progress) ---- */
function progress(p, head, sub){
  $('ringP').style.strokeDashoffset = 327*(1-p/100); $('ringT').textContent = Math.round(p)+'%';
  if (head) $('sendH').textContent = head; if (sub !== undefined) $('sendP').textContent = sub;
}
function failSend(msg){ $('sendov').hidden = true; sending = false; $('wNext').disabled = false; banner('msg', false, msg); }
function submitCase(){
  const err = validate(1) || validate(2) || validate(3);
  if (err) return banner('msg', false, err);
  const fd = new FormData(), put = (k,v) => fd.append(k, v);
  put('category',chosen); put('description',$('description').value.trim()); put('incidentDate',$('incDate').value); put('incidentTime',$('incTime').value);
  put('platform',$('platform').value); put('identifiers',$('identifiers').value.trim()); put('location',$('location').value.trim());
  put('city',$('city').value.trim()); put('state',$('state').value.trim()); put('jurisdiction',$('juris').value.trim()); put('hasLoss',hasLoss?'yes':'no');
  if (hasLoss) { put('amountLost',$('amount').value.replace(/,/g,'').trim()); put('paymentMethod',$('payMethod').value); put('bankName',$('bank').value.trim());
    put('transactionRef',$('txnRef').value.trim()); put('transactionDate',$('txnDate').value); put('beneficiary',$('payee').value.trim()); }
  put('confirm','yes');
  const ok = files.filter(f=>f.status==='ok'); ok.forEach(f => fd.append('evidence', f.file, f.file.name));

  sending = true; $('wNext').disabled = true; $('sendov').hidden = false;
  progress(3, 'Preparing your complaint', 'Please keep this page open.');
  const x = new XMLHttpRequest(); x.open('POST', BASE+'/api/case'); x.withCredentials = true;
  x.upload.onprogress = e => { if (e.lengthComputable) progress(5 + e.loaded/e.total*85, ok.length ? 'Uploading your evidence' : 'Sending your complaint', ok.length+' file'+(ok.length===1?'':'s')+' · '+fsize(e.loaded)+' of '+fsize(e.total)); };
  x.upload.onload = () => progress(93, 'Verifying files & creating your reference number', 'Almost done…');
  x.onerror = () => failSend('Cannot reach the server. Your details are still here — please try again.');
  x.onload = () => {
    if (x.status === 401) { location.href = BASE+'/index.html'; return; }
    let d = {}; try { d = JSON.parse(x.responseText); } catch (_) {}
    if (x.status >= 200 && x.status < 300) { progress(100, 'Complaint received', ''); setTimeout(() => showDone(d), 700); }
    else failSend(d.message || (x.status===413 ? 'The upload is too large. Each file can be up to 5 MB.' : 'The server returned HTTP '+x.status+'. Please try again.'));
  };
  x.send(fd);
}

/* ---- success + reset ---- */
function showDone(d){
  $('sendov').hidden = true; sending = false; $('wNext').disabled = false;
  const att = d.attached || [], rej = d.rejected || [];
  $('done').innerHTML =
    '<svg class="chk" viewBox="0 0 96 96"><circle cx="48" cy="48" r="46"/><path d="M28 50l14 14 27-34"/></svg>'+
    '<h2>Your complaint has been filed</h2>'+
    '<div class="refno">'+esc(d.referenceNo||'')+'</div>'+
    '<p>Keep this reference number safe. Your case is marked <span class="tag '+esc(d.severity)+'">'+esc(d.severity)+' priority</span> and will be assigned to an officer. We have emailed you a confirmation, and you can follow every step under <b>My cases</b>.</p>'+
    '<div class="got">'+att.map(a=>'<div><span>✔ '+esc(a.name)+'</span><span>'+fsize(a.size)+' · attached</span></div>').join('')+
      rej.map(a=>'<div class="no"><span>✖ '+esc(a.name)+'</span><span>'+esc(a.reason)+'</span></div>').join('')+
      (!att.length && !rej.length ? '<div><span>No evidence files were added</span><span>You can share them with the officer later</span></div>' : '')+'</div>'+
    '<div class="acts"><button class="btn primary" id="dCases">View my cases</button><button class="btn" id="dNew">File another complaint</button></div>';
  $('done').hidden = false; $('wiz').classList.add('finished');
  $('dCases').onclick = () => { resetWizard(); show('cases'); };
  $('dNew').onclick = () => resetWizard();
  loadCases(); window.scrollTo({top:0, behavior:'smooth'});
}
function resetWizard(){
  $('done').hidden = true; $('wiz').classList.remove('finished');
  ['description','incDate','incTime','identifiers','location','city','state','juris','amount','bank','txnRef','txnDate','payee'].forEach(i => $(i).value='');
  $('platform').value=''; $('payMethod').value=''; $('confirm').checked=false; $('count').textContent='0';
  files.forEach(f => f.url && URL.revokeObjectURL(f.url)); files = []; renderFiles();
  lossTouched = false; pick(''); setLoss(null, false); goStep(1);
}

/* ================= Civic issues ================= */
const CIVIC = [
  {k:'roads', ic:'road', n:'Roads & Public Infrastructure', d:'Potholes, footpaths, streetlights, signals', auth:'Municipal corporation / PWD / traffic police', issues:[
    {t:'Broken roads and potholes'},{t:'Damaged footpaths and blocked drains'},{t:'Broken streetlights'},{t:'Damaged public property'},{t:'Missing road signs and traffic signals', tip:'A signal that is dead at a busy junction can cause accidents. If traffic is in chaos, tell the traffic police by calling 112.'}]},
  {k:'hazards', ic:'tree', n:'Fallen Trees & Natural Hazards', d:'Fallen trees, flooding, landslides', auth:'Municipal tree / disaster management cell', issues:[
    {t:'Trees or large branches fallen on roads', tip:'If someone is trapped or hurt, or the tree is on wires, call 112. Keep away from any wires touching the tree.'},{t:'Trees at risk of falling'},
    {t:'Flooding and waterlogging', tip:'Never walk or drive through flowing or deep water. If there is danger to life, call 112.'},
    {t:'Landslides or storm damage', tip:'Move away from the slope or damaged structure. If anyone is in danger, call 112.'},
    {t:'Obstructions blocking public roads'}]},
  {k:'utilities', ic:'zap', n:'Electricity & Utility Hazards', d:'Poles, wires, transformers, water, sewage', auth:'Electricity distribution company / water board', issues:[
    {t:'Fallen or leaning electric poles', warn:'E'},{t:'Exposed electrical wires', warn:'E'},{t:'Sparking transformers', warn:'E'},
    {t:'Water supply interruptions'},{t:'Sewage leaks and overflowing drains'}]},
  {k:'disturbances', ic:'mega', n:'Public Disturbances & Neighbourhood Disputes', d:'Noise, quarrels, disputes, fights', auth:'Local police station (non-emergency)', issues:[
    {t:'Loud noise and public nuisance'},{t:'Public arguments and disturbances'},
    {t:'Neighbourhood quarrels', mode:'civil'},{t:'Property or boundary disputes', mode:'civil'},
    {t:'Threats, assault, or physical fights', mode:'police'}]},
  {k:'sanitation', ic:'trash', n:'Sanitation & Environmental Issues', d:'Garbage, drains, strays, pollution', auth:'Municipal sanitation / pollution control board', issues:[
    {t:'Garbage accumulation and illegal dumping'},{t:'Open drains and sewage overflow'},{t:'Stray animal concerns'},{t:'Air or noise pollution'},{t:'Unsafe or unhygienic public spaces'}]},
];
let cgrp = null, cissue = null, cgeo = null;
$('civGroups').innerHTML = CIVIC.map(g => '<button type="button" class="cg" data-g="'+g.k+'"><span class="ic">'+icon(g.ic)+'</span><b>'+esc(g.n)+'</b><span class="d">'+esc(g.d)+'</span></button>').join('');
$('civGroups').addEventListener('click', e => { const b=e.target.closest('.cg'); if(b) civPickGroup(b.dataset.g); });
function civPickGroup(k){
  cgrp = CIVIC.find(g=>g.k===k); cissue = null;
  document.querySelectorAll('#civGroups .cg').forEach(b=>b.classList.toggle('on', b.dataset.g===k));
  $('civTypes').hidden = false;
  $('civTypes').innerHTML = '<h2 style="margin:0">'+esc(cgrp.n)+'</h2><div class="hint" style="margin-top:2px">What is the problem? &middot; Goes to: '+esc(cgrp.auth)+'</div><div class="chips">'+
    cgrp.issues.map((s,i)=>'<button type="button" class="chipb'+(s.warn||s.mode==='police'?' danger':'')+'" data-i="'+i+'">'+esc(s.t)+'</button>').join('')+'</div>';
  $('civCtx').innerHTML = ''; $('civForm').hidden = true;
}
$('civTypes').addEventListener('click', e => { const b=e.target.closest('.chipb'); if(b) civPickIssue(+b.dataset.i); });
function civPickIssue(i){
  cissue = cgrp.issues[i];
  document.querySelectorAll('#civTypes .chipb').forEach((b,j)=>b.classList.toggle('on', j===i));
  let h = '', showForm = true;
  if (cissue.warn === 'E') {
    h = '<div class="ctxcard red pulse"><h3>⚠️ ELECTRICAL DANGER — keep away</h3>'+
      '<ul><li><b>Do not go near, touch or try to move</b> fallen, hanging, sparking or exposed wires, poles or transformers &mdash; even if they look dead.</li>'+
      '<li>Keep children, animals and vehicles well back, and stay out of puddles or water near the wire.</li>'+
      '<li>Call your <b>electricity company’s emergency / complaint line</b> (many states use <b>1912</b> &mdash; check your electricity bill) <b>and 112</b> if anyone is hurt or there is fire or smoke.</li></ul>'+
      '<div class="acts"><a class="btn callb" href="tel:112">📞 Call 112</a><a class="btn" href="tel:1912">⚡ Electricity helpline 1912*</a></div>'+
      '<div class="hint">*The number differs in some states. Logging a report below does <b>not</b> replace calling.</div></div>';
  } else if (cissue.mode === 'police') {
    showForm = false;
    h = '<div class="ctxcard red pulse"><h3>🚨 This needs the police</h3><p>Threats, violence and immediate danger are police matters. If anyone is in danger right now, <b>call 112</b>. Do not try to separate a fight yourself.</p>'+
      '<div class="acts"><a class="btn callb" href="tel:112">📞 Call 112</a><button type="button" class="btn primary" id="goAssault">File a police complaint</button><button type="button" class="btn" data-go="chat">Chat with a station</button></div></div>';
  } else if (cissue.mode === 'civil') {
    showForm = false;
    h = '<div class="ctxcard blue"><h3>🤝 This is usually a civil matter</h3><p>Neighbourhood quarrels and property or boundary disputes are normally <b>not registered as an FIR</b> unless a crime is involved. Better routes:</p>'+
      '<ul><li><b>Mediation</b> through your District Legal Services Authority or Lok Adalat (free).</li><li>The <b>ward office / panchayat</b> for local disputes, or the <b>civil court</b> / revenue office for boundary and title issues.</li><li>Ask your police station for guidance &mdash; they can advise and may call both sides to talk.</li></ul>'+
      '<p style="margin-top:8px"><b>If there are threats, violence or a risk of it, call 112.</b></p>'+
      '<div class="acts"><button type="button" class="btn primary" data-go="chat">Ask a station for advice</button><button type="button" class="btn" data-go="appt">Book an appointment</button><a class="btn callb" href="tel:112">📞 Call 112</a></div></div>';
  } else {
    h = '<div class="ctxcard amber"><h3>✔ Goes to: '+esc(cgrp.auth)+'</h3>'+(cissue.tip?'<p>'+esc(cissue.tip)+'</p>':'<p>Add where it is and what you see. If anyone is in danger, call 112 instead.</p>')+'</div>';
  }
  $('civCtx').innerHTML = h;
  if (cissue.mode === 'police') $('goAssault').onclick = () => { show('file'); pick('Assault'); };
  $('civForm').hidden = !showForm;
  if (showForm) { $('civFormH').textContent = cissue.warn==='E' ? 'Also log this hazard for the authorities' : 'Describe the problem'; $('cv-msg').className='banner'; }
  $('civCtx').scrollIntoView({behavior:'smooth', block:'nearest'});
}
$('cv-gps').addEventListener('click', () => {
  if (!navigator.geolocation) return $('cv-gpsnote').textContent = 'Location is not available in this browser. Please type the place.';
  $('cv-gpsnote').textContent = 'Getting your location…';
  navigator.geolocation.getCurrentPosition(p => {
    cgeo = {lat:p.coords.latitude, lng:p.coords.longitude};
    $('cv-gpsnote').textContent = '✔ Location captured (±'+Math.round(p.coords.accuracy)+' m). Still add a landmark so officials can find it.';
    if (!$('cv-loc').value.trim()) $('cv-loc').value = 'Near '+cgeo.lat.toFixed(5)+', '+cgeo.lng.toFixed(5);
  }, () => $('cv-gpsnote').textContent = 'Could not get your location. Please type the place instead.', {timeout:8000, maximumAge:300000});
});
$('cv-submit').addEventListener('click', async () => {
  if (!cgrp || !cissue) return banner('cv-msg', false, 'Please choose the problem first.');
  const loc = $('cv-loc').value.trim(), desc = $('cv-desc').value.trim();
  if (loc.length < 5) { flag('cv-loc'); return banner('cv-msg', false, 'Please tell us where the problem is.'); }
  if (desc.length < 10) { flag('cv-desc'); return banner('cv-msg', false, 'Please describe the problem (at least 10 characters).'); }
  $('cv-submit').disabled = true;
  const body = {group:cgrp.k, issue:cissue.t, location:loc, description:desc, urgent:$('cv-urgent').checked?'yes':'no'};
  if (cgeo) { body.lat = cgeo.lat; body.lng = cgeo.lng; }
  const r = await post('/api/civic', body);
  $('cv-submit').disabled = false;
  banner('cv-msg', r.ok, r.data.message || 'Could not submit the report.');
  if (r.ok) { $('cv-loc').value=''; $('cv-desc').value=''; $('cv-urgent').checked=false; cgeo=null; $('cv-gpsnote').textContent=''; loadCivic(); }
});
async function loadCivic(){
  const r = await api('/api/civic'); if (!r.ok) return;
  $('civList').innerHTML = r.data.length ? r.data.map(c =>
    '<div class="card"><div class="top"><b>'+esc(c.reference)+'</b><span class="chip Pending">'+esc(c.status)+'</span>'+(c.urgent?'<span class="tag Critical">Urgent</span>':'')+'</div>'+
    '<div class="meta">'+esc(c.issue)+' &middot; '+esc(hhmm(c.filedAt))+'</div><p>'+esc(c.description)+'</p>'+
    '<div class="meta">📍 '+esc(c.location)+(c.lat!=null?' · <a style="color:var(--amber)" target="_blank" rel="noopener" href="https://www.google.com/maps?q='+c.lat+','+c.lng+'">map</a>':'')+'<br>Sent to: '+esc(c.authority)+'</div></div>').join('')
    : '<div class="empty">You have not reported any civic issues yet.</div>';
}

/* ================= Police near me (map) ================= */
// Approximate neighbourhood-level positions, keyed "Station|City". Unknown stations fall back to their city centre.
const GEO = {
 'Whitefield PS|Bangalore':[12.9698,77.7500],'Koramangala PS|Bangalore':[12.9352,77.6245],'Jayanagar PS|Bangalore':[12.9250,77.5938],
 'Mysore Central PS|Mysore':[12.3052,76.6552],'Vijayanagar PS|Mysore':[12.3300,76.6100],
 'T Nagar PS|Chennai':[13.0418,80.2341],'Anna Nagar PS|Chennai':[13.0850,80.2101],'Adyar PS|Chennai':[13.0012,80.2565],
 'RS Puram PS|Coimbatore':[11.0076,76.9496],'Gandhipuram PS|Coimbatore':[11.0183,76.9725],
 'Governorpet PS|Vijayawada':[16.5193,80.6200],'MVP Colony PS|Visakhapatnam':[17.7440,83.3350],'Dwaraka Nagar PS|Visakhapatnam':[17.7220,83.3050],
 'Banjara Hills PS|Hyderabad':[17.4126,78.4482],'Madhapur PS|Hyderabad':[17.4486,78.3908],'Secunderabad PS|Hyderabad':[17.4399,78.4983],
 'Andheri PS|Mumbai':[19.1197,72.8464],'Bandra PS|Mumbai':[19.0596,72.8295],'Dadar PS|Mumbai':[19.0178,72.8478],
 'Shivaji Nagar PS|Pune':[18.5308,73.8475],'Kothrud PS|Pune':[18.5074,73.8077],
 'Connaught Place PS|New Delhi':[28.6315,77.2167],'Karol Bagh PS|New Delhi':[28.6519,77.1909],'Saket PS|New Delhi':[28.5245,77.2066],'Vasant Kunj PS|New Delhi':[28.5200,77.1590],'Rohini PS|New Delhi':[28.7383,77.0822],
 'Kakkanad PS|Kochi':[10.0159,76.3419],'Fort Kochi PS|Kochi':[9.9658,76.2421],'Palayam PS|Thiruvananthapuram':[8.5014,76.9490],
 'Park Street PS|Kolkata':[22.5535,88.3520],'Salt Lake PS|Kolkata':[22.5867,88.4170],'Howrah PS|Kolkata':[22.5958,88.2636],
 'Hazratganj PS|Lucknow':[26.8467,80.9462],'Gomti Nagar PS|Lucknow':[26.8530,81.0010],'Alambagh PS|Lucknow':[26.8050,80.9000],
 'Sector 18 PS|Noida':[28.5700,77.3219],'Sector 62 PS|Noida':[28.6270,77.3649],
 'Navrangpura PS|Ahmedabad':[23.0360,72.5600],'Satellite PS|Ahmedabad':[23.0260,72.5100],'Adajan PS|Surat':[21.1950,72.7930],'Vesu PS|Surat':[21.1400,72.7700],
 'C-Scheme PS|Jaipur':[26.9124,75.8000],'Malviya Nagar PS|Jaipur':[26.8530,75.8100],'Model Town PS|Ludhiana':[30.9000,75.8500],
 'Sector 17 PS|Chandigarh':[30.7410,76.7790],'Sector 34 PS|Chandigarh':[30.7200,76.7600],
 'Saheed Nagar PS|Bhubaneswar':[20.2900,85.8400],'Patia PS|Bhubaneswar':[20.3500,85.8190],'Fancy Bazar PS|Guwahati':[26.1830,91.7330],'Dispur PS|Guwahati':[26.1433,91.7898]
};
const CITY_GEO = {Bangalore:[12.9716,77.5946],Mysore:[12.2958,76.6394],Chennai:[13.0827,80.2707],Coimbatore:[11.0168,76.9558],Vijayawada:[16.5062,80.6480],Visakhapatnam:[17.6868,83.2185],Hyderabad:[17.3850,78.4867],Mumbai:[19.0760,72.8777],Pune:[18.5204,73.8567],'New Delhi':[28.6139,77.2090],Kochi:[9.9312,76.2673],Thiruvananthapuram:[8.5241,76.9366],Kolkata:[22.5726,88.3639],Lucknow:[26.8467,80.9462],Noida:[28.5355,77.3910],Ahmedabad:[23.0225,72.5714],Surat:[21.1702,72.8311],Jaipur:[26.9124,75.7873],Ludhiana:[30.9010,75.8573],Chandigarh:[30.7333,76.7794],Bhubaneswar:[20.2961,85.8245],Guwahati:[26.1445,91.7362]};

let map = null, mapStations = null, mapMarkers = {}, meLayer = null, routeLayer = null, myPos = null, leafletP = null;
function loadLeaflet(){
  if (window.L) return Promise.resolve();
  if (leafletP) return leafletP;
  leafletP = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel='stylesheet'; css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload=res; s.onerror=()=>{ leafletP=null; rej(new Error('map library')); }; document.head.appendChild(s);
  });
  return leafletP;
}
// start downloading the map library as soon as the person shows interest in the tab
['pointerenter','touchstart'].forEach(ev => document.querySelector('#nav [data-t="map"]').addEventListener(ev, () => { loadLeaflet().catch(()=>{}); }, {once:true, passive:true}));

function km(a, b){ const R=6371, r=Math.PI/180, dLat=(b[0]-a[0])*r, dLng=(b[1]-a[1])*r;
  const h=Math.sin(dLat/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function pinIcon(cls){ return L.divIcon({className:'', html:'<div class="pin '+(cls||'')+'"><i></i></div>', iconSize:[26,26], iconAnchor:[13,13], popupAnchor:[0,-12]}); }

async function openMap(){
  if (map) { setTimeout(()=>map.invalidateSize(), 50); return; }
  try {
    const [r] = await Promise.all([api('/api/stations?all=1'), loadLeaflet()]);
    if (!r.ok) throw new Error('stations');
    // one pin per station
    const byKey = {};
    r.data.forEach(o => { const key = o.station+'|'+o.city; if (!byKey[key]) { const g = GEO[key] || CITY_GEO[o.city]; if (g) byKey[key] = {key, station:o.station, city:o.city, state:o.state, phone:o.contactNumber, officerId:o.officerId, pos:g}; } });
    mapStations = Object.values(byKey);
    map = L.map('map', {preferCanvas:true, zoomControl:true}).setView([22.5,79], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
    mapStations.forEach(s => {
      const m = L.marker(s.pos, {icon:pinIcon(), title:s.station}).addTo(map);
      m.bindPopup(popHTML(s)); mapMarkers[s.key] = m;
    });
    map.fitBounds(mapStations.map(s=>s.pos), {padding:[30,30]});
    renderMapList();
    $('mapLoading').classList.add('off');
    setTimeout(()=>map.invalidateSize(), 80);
  } catch (e) {
    $('mapLoading').innerHTML = 'Could not load the map. Check your internet connection and try again.';
  }
}
function popHTML(s, d){
  return '<div class="popb"><b>'+esc(s.station)+'</b><span>'+esc(s.city)+', '+esc(s.state)+(d!=null?' · <b>'+d.toFixed(1)+' km</b>':'')+'</span>'+
    '<div><a href="tel:'+esc(s.phone)+'">📞 '+esc(s.phone)+'</a><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+s.pos[0]+','+s.pos[1]+'">🧭 Directions</a></div></div>';
}
function renderMapList(){
  const q = $('mapSearch').value.trim().toLowerCase();
  let list = mapStations.map(s => Object.assign({d: myPos ? km(myPos, s.pos) : null}, s));
  if (myPos) list.sort((a,b)=>a.d-b.d); else list.sort((a,b)=>a.city.localeCompare(b.city)||a.station.localeCompare(b.station));
  const shown = list.filter(s => !q || (s.station+' '+s.city+' '+s.state).toLowerCase().includes(q));
  $('mapList').innerHTML = shown.length ? shown.map((s,i) => '<div class="mc'+(myPos&&i===0&&!q?' first':'')+'" data-k="'+esc(s.key)+'">'+(s.d!=null?'<span class="dist">'+s.d.toFixed(1)+' km</span>':'')+'<b>'+esc(s.station)+'</b><small>'+esc(s.city)+', '+esc(s.state)+'</small></div>').join('') : '<div class="empty">No station matches.</div>';
}
function focusStation(key){
  const s = mapStations.find(x=>x.key===key), m = mapMarkers[key]; if (!s || !m) return;
  map.flyTo(s.pos, Math.max(map.getZoom(), 14), {duration:1.1}); setTimeout(()=>m.openPopup(), 900);
  document.querySelectorAll('#mapList .mc').forEach(c=>c.classList.toggle('on', c.dataset.k===key));
}
$('mapList').addEventListener('click', e => { const c=e.target.closest('.mc'); if (c) focusStation(c.dataset.k); });
$('mapSearch').addEventListener('input', () => mapStations && renderMapList());
$('mapAll').addEventListener('click', () => { if (!map) return; if (routeLayer) { map.removeLayer(routeLayer); routeLayer=null; } map.flyToBounds(mapStations.map(s=>s.pos), {padding:[30,30], duration:1}); });
$('mapLocate').addEventListener('click', async () => {
  if (!map) await openMap(); if (!map) return;
  if (!navigator.geolocation) return $('mapNote').textContent = 'Location is not available in this browser. Search for your area in the list instead.';
  $('mapNote').textContent = 'Finding you…'; $('mapLocate').disabled = true;
  navigator.geolocation.getCurrentPosition(p => {
    $('mapLocate').disabled = false;
    myPos = [p.coords.latitude, p.coords.longitude];
    mapStations.forEach(s => s.d = km(myPos, s.pos));
    const near = mapStations.slice().sort((a,b)=>a.d-b.d).slice(0,3);
    if (meLayer) map.removeLayer(meLayer); if (routeLayer) map.removeLayer(routeLayer);
    meLayer = L.layerGroup([L.marker(myPos,{icon:pinIcon('me'),zIndexOffset:1000}).bindPopup('You are here'), L.circle(myPos,{radius:Math.max(30,p.coords.accuracy),color:'#F4A300',weight:1,fillOpacity:.1})]).addTo(map);
    routeLayer = L.layerGroup(near.map((s,i)=>L.polyline([myPos,s.pos],{color:i?'#3A86FF':'#3DBE7A',weight:i?2:3,opacity:.9,className:'route'}))).addTo(map);
    Object.keys(mapMarkers).forEach(k => { const near0 = k===near[0].key; mapMarkers[k].setIcon(pinIcon(near0?'near':'')); mapMarkers[k].setPopupContent(popHTML(mapStations.find(s=>s.key===k), mapStations.find(s=>s.key===k).d)); });
    map.flyToBounds([myPos, near[0].pos, near[1].pos, near[2].pos], {padding:[50,50], duration:1.2, maxZoom:15});
    setTimeout(()=>mapMarkers[near[0].key].openPopup(), 1300);
    renderMapList();
    $('mapNote').innerHTML = 'Nearest: <b>'+esc(near[0].station)+'</b> ('+near[0].d.toFixed(1)+' km). '+(near[0].d>60?'That is far &mdash; stations listed are the ones in our directory.':'');
  }, err => { $('mapLocate').disabled = false; $('mapNote').textContent = err.code===1 ? 'Location permission was denied. Allow it in your browser, or search the list for your area.' : 'Could not get your location. Search the list for your area instead.'; },
  {enableHighAccuracy:false, timeout:8000, maximumAge:300000});
});

/* ---------- boot ---------- */
guard('user').then(async ok => {
  if (!ok) return;
  const me = await api('/api/me'); greet(me.data.name);
  loadNews(); loadCases();
  const start = location.hash.slice(1); if (['file','efir','appt','chat','cases','civic','map'].includes(start)) show(start);
  // background refresh so appointment answers show up without reloading
  setInterval(() => { if ($('t-appt').classList.contains('on')) loadAppts(); else api('/api/appointments').then(r => {
      if (!r.ok) return; const now={}; r.data.forEach(a=>now[a.appointmentId]=a.status);
      if (lastStatus) r.data.forEach(a => { if (lastStatus[a.appointmentId]==='Pending' && a.status!=='Pending') toast('Appointment #'+a.appointmentId+' at '+a.station+' was '+a.status.toLowerCase()+'.'); });
      lastStatus = now; }); }, 10000);
  api('/api/appointments').then(r => { if (r.ok) { lastStatus={}; r.data.forEach(a=>lastStatus[a.appointmentId]=a.status); } });
});
</script>
<script>
/* ===== v4 visuals: icons, spotlight, scroll progress, particle background ===== */
document.querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = icon(el.dataset.ic); });
document.addEventListener('pointermove', e => {
  const t = e.target.closest && e.target.closest('.svc,.cg,.tcard,.sos a,.ncard,.panel'); if (!t) return;
  const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, {passive:true});
(function(){
  const bar = document.getElementById('prog');
  function upd(){ const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%'; }
  addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
})();
(function(){
  const c = document.getElementById('bgc'); if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = c.getContext('2d'); let W, H, P = [], mx = -999, my = -999; const dpr = Math.min(devicePixelRatio || 1, 2);
  function size(){
    W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(72, Math.round(W * H / 20000));
    P = Array.from({length:n}, () => ({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28, r:Math.random()*1.6+.6, w:Math.random()<.18}));
  }
  addEventListener('resize', size); addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive:true}); size();
  (function frame(){
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mx, dy = p.y - my; if (dx*dx + dy*dy < 14000) { p.x += dx * .0018; p.y += dy * .0018; }
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fillStyle = p.w ? 'rgba(255,196,120,.85)' : 'rgba(150,205,255,.7)'; x.fill();
    }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, d = dx*dx + dy*dy;
      if (d < 16000) { x.strokeStyle = 'rgba(130,175,255,' + (0.17 * (1 - d/16000)) + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
    }
    requestAnimationFrame(frame);
  })();
})();
</script>
<script src="sections-data.js"></script>
<script src="sections.js"></script>
<script src="concern-community.js"></script>
<script src="portal-header.js"></script>
<script src="suraksha-ai.js"></script>
<script src="assistant.js"></script>
</body>
</html>
