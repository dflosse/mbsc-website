import { Link } from 'react-router-dom'

// DRAFT – to be reviewed and adopted by the MBFC committee.
export default function Privacy() {
  return (
    <div className="wrap narrow prose">
      <h1>Privacy statement</h1>
      <p className="muted small">Mount Beauty Football Club Inc. (MBFC) · Draft for committee adoption, November 2026</p>

      <p>We're a volunteer-run junior soccer club. We collect only what we need to run the club and keep children safe, and we take extra care with children's information.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Parents and guardians:</b> name, email, mobile and (if you volunteer) home address.</li>
        <li><b>Children:</b> name, date of birth, gender, medical conditions or allergies you tell us about, an emergency contact, photo permission, team, gala availability, whether they need a loan uniform or boots (and sizes), whether a refundable bond has been paid or returned, and whether Football Victoria registration and fees are complete.</li>
        <li><b>Coaches, committee members and volunteers:</b> name, contact details, home address, and your Working With Children Check number, expiry and a copy of the card.</li>
      </ul>

      <h2>Why</h2>
      <p>To organise teams, training and gala days; to contact you; to keep children safe (medical and emergency information, release arrangements); to meet Football Victoria requirements; and to meet Victoria's Child Safe Standards and Working With Children Check obligations.</p>

      <h2>Who can see it</h2>
      <ul>
        <li><b>You</b> can see and update your own details and your children's.</li>
        <li><b>Your child's coach</b> sees your child's name, birth year, medical notes, photo permission, gala availability, and your name and phone number.</li>
        <li><b>The executive committee</b> (President, Vice President, Secretary, Treasurer) can see all registration details and Working With Children Check records, so they can sign off registrations and volunteers.</li>
        <li>Other committee members and volunteers <b>cannot</b> see children's details. If two parents are linked to the same child, neither can see the other's contact details.</li>
        <li>We don't sell or share your information. Football Victoria registration happens separately on its PlayFootball system, under Football Victoria's own privacy policy (see <a href="https://footballvictoria.com.au" target="_blank" rel="noreferrer">footballvictoria.com.au</a>).</li>
      </ul>

      <h2>Working With Children Checks</h2>
      <p><b>Who needs one:</b> every coach, every committee member (including the executive) and every volunteer who helps with the club – including casual helpers at training or gala days, such as canteen, BBQ or pack-up. This is a club rule, and Football Victoria also requires a current check for coaches, officials and club contacts. Parents who only watch their own child don't need one.</p>
      <p><b>What we collect:</b> your full name, address, email and mobile, your WWCC card number and expiry date, and a photo or scan of the card. These are the details the club needs to check and record your card under Victoria's rules.</p>
      <p><b>How we use it:</b></p>
      <ul>
        <li>An executive committee member checks that your card is current using the Service Victoria WWC status check.</li>
        <li>They connect you to the club in WWC Connect, which has been required in Victoria since 19 October 2026. To do this the club gives the Social Services Regulator (through Service Victoria) your name, WWCC card number, address, email and phone number. The Regulator then tells the club if your check status changes.</li>
        <li>If you change your name, address, email or phone on this site, the executive updates WWC Connect within 21 days, as the law requires. When you stop volunteering, they disconnect you within 21 days.</li>
        <li>We record the date each step was done. Your coach, committee or volunteer role is only switched on once both are complete.</li>
        <li>We use the expiry date to remind you (and the executive) to renew before it runs out.</li>
        <li>If a check is suspended, revoked or expires, the role is switched off until it's sorted.</li>
      </ul>
      <p><b>Who sees it:</b> only you and the executive committee. Coaches, other committee members and parents cannot see your WWCC details. We don't share them with anyone except Service Victoria and the Social Services Regulator (through the steps above), or Football Victoria if it asks us to confirm a coach or official is checked.</p>

      <h2>Gala results</h2>
      <p>Game times, pitches and scores are public. Goal scorers (first name and surname initial) and end-of-season awards are only shown to signed-in members: families with a registered child, approved coaches and volunteers, and the committee. Coaches can only record goals for players in their own team.</p>

      <h2>Photos</h2>
      <p>We only use photos of children on club social media or this website if a parent has given permission. You can change this at any time in My family.</p>

      <h2>How we protect it</h2>
      <p>Information is stored in an Australian data centre (Sydney) with encrypted connections. Access is controlled by the database itself, not just the website. Executive, committee, coach and volunteer accounts must use two-factor sign-in. Working With Children Check images are stored privately and can only be opened by the person and the executive. Changes to registrations, approvals and access are logged.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Player registrations are kept for the current and previous season so returning families don't have to start again, then reviewed by the committee.</li>
        <li>Working With Children Check records and card images are deleted from this site when someone stops volunteering, and at the latest 12 months after their last approved role. The record of your connection in WWC Connect is held by the Regulator, and the law requires clubs to be able to show it for at least 7 years after you stop.</li>
        <li>You can ask us to delete your account and your children's records at any time, unless we must keep something to meet a legal or insurance obligation.</li>
      </ul>

      <h2>Access, corrections and complaints</h2>
      <p>Most details you can update yourself after <Link to="/login">signing in</Link>. For anything else – a copy of what we hold, a correction, deletion, or a concern about how we've handled your information – email the club secretary at mtbeautysoccerclub@gmail.com. If you're not satisfied with our response, you can contact the <a href="https://www.oaic.gov.au/privacy/privacy-complaints" target="_blank" rel="noreferrer">Office of the Australian Information Commissioner</a>.</p>

      <p>Child safety concerns should be raised with any executive committee member straight away, or directly with Football Victoria. If a child is in immediate danger, call 000.</p>
    </div>
  )
}
