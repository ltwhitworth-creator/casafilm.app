export default function Home() {
  return (
    <html lang="en">
      <head>
        <title>Casa Film — Coming Soon</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400&family=Jost:wght@300;400&display=swap" rel="stylesheet" />
      </head>
      <body dangerouslySetInnerHTML={{__html: `
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --linen: #f5f0e8;
            --amber: #b5874a;
            --amber-light: #d4a865;
            --dark: #1a1410;
            --muted: rgba(26,20,16,0.42);
            --border: rgba(26,20,16,0.1);
            --border-amber: rgba(181,135,74,0.25);
          }
          body {
            background: var(--linen);
            color: var(--dark);
            font-family: 'Jost', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
            cursor: none;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 580px;
            width: 100%;
          }
          .logo { margin-bottom: 64px; }
          .logo-casa {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 52px;
            color: var(--dark);
            line-height: 0.95;
          }
          .logo-film-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 4px;
          }
          .logo-line { flex:1; height:1.5px; background:var(--amber); }
          .logo-film {
            font-family: 'DM Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            color: var(--amber);
          }
          .eyebrow {
            font-family: 'DM Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: var(--amber);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .eyebrow::before, .eyebrow::after {
            content: '';
            width: 24px;
            height: 1px;
            background: var(--border-amber);
          }
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 52px;
            font-weight: 400;
            line-height: 1.1;
            margin-bottom: 24px;
            color: var(--dark);
          }
          h1 em { font-style: italic; color: var(--amber); }
          .description {
            font-size: 15px;
            color: var(--muted);
            line-height: 1.8;
            max-width: 440px;
            margin-bottom: 52px;
          }
          .count-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: white;
            border: 1px solid var(--border);
            padding: 8px 18px;
            margin-bottom: 40px;
          }
          .count-badge-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
          }
          .count-badge-text {
            font-family: 'DM Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .join-btn {
            display: inline-block;
            background: var(--dark);
            color: #f0e8d8;
            border: none;
            padding: 20px 52px;
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            margin-bottom: 16px;
          }
          .form-note {
            font-family: 'DM Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.12em;
            color: rgba(26,20,16,0.28);
            text-transform: uppercase;
            margin-bottom: 48px;
          }
          .features-teaser {
            display: flex;
            gap: 32px;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 64px;
          }
          .feat-item { display:flex; align-items:center; gap:8px; }
          .feat-dot { width:5px; height:5px; border-radius:50%; background:var(--amber); }
          .feat-text {
            font-family:'DM Mono',monospace;
            font-size:9px;
            letter-spacing:0.15em;
            text-transform:uppercase;
            color:var(--muted);
          }
          .divider {
            width:100%;
            height:1px;
            background:linear-gradient(90deg,transparent,var(--border-amber),transparent);
            margin-bottom:40px;
          }
          .footer-tagline {
            font-family:'Playfair Display',serif;
            font-style:italic;
            font-size:15px;
            color:rgba(26,20,16,0.3);
            display:block;
            margin-bottom:8px;
          }
          .footer-domain {
            font-family:'DM Mono',monospace;
            font-size:9px;
            letter-spacing:0.2em;
            text-transform:uppercase;
            color:rgba(26,20,16,0.2);
            display:block;
          }
          @keyframes pulse {
            0%,100%{opacity:1;transform:scale(1)}
            50%{opacity:0.5;transform:scale(0.85)}
          }
        </style>
        <div class="container">
          <div class="logo">
            <div class="logo-casa">Casa</div>
            <div class="logo-film-row">
              <div class="logo-line"></div>
              <div class="logo-film">Film</div>
            </div>
          </div>
          <div class="eyebrow">Coming Soon</div>
          <h1>A home for your<br><em>finest work</em></h1>
          <p class="description">Beautiful, branded video galleries for filmmakers. Deliver your work to clients the way it deserves to be seen — securely, personally, and unmistakably yours.</p>
          <div class="count-badge">
            <div class="count-badge-dot"></div>
            <span class="count-badge-text">Be first to know when we launch</span>
          </div>
          <a href="https://tally.so/r/9qJvR5" target="_blank" class="join-btn">Join the Waitlist</a>
          <p class="form-note">No spam, ever. Just a note when Casa Film launches.</p>
          <div class="features-teaser">
            <div class="feat-item"><div class="feat-dot"></div><span class="feat-text">Branded galleries</span></div>
            <div class="feat-item"><div class="feat-dot"></div><span class="feat-text">4K streaming</span></div>
            <div class="feat-item"><div class="feat-dot"></div><span class="feat-text">Client approvals</span></div>
            <div class="feat-item"><div class="feat-dot"></div><span class="feat-text">View analytics</span></div>
            <div class="feat-item"><div class="feat-dot"></div><span class="feat-text">Secure delivery</span></div>
          </div>
          <div class="divider"></div>
          <span class="footer-tagline">Where your films live</span>
          <span class="footer-domain">casafilm.co</span>
        </div>
      `}} />
    </html>
  )
}