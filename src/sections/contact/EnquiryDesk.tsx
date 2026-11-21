/*
  00 · the enquiry desk: six quick answers, written up live as a carton label (src/sections/contact/enquiryDesk.ts)
*/
import { FamilyPicks } from './FamilyPicks';
import { t } from '@/i18n';
import { company } from '@/data/site';
import { CmsText } from '@/components/site/CmsText';

export function EnquiryDesk() {
  return (
    <section className="ct-desk" id="enquiry" data-theme="dark">
      <div className="ct-desk__glow" aria-hidden="true"></div>
      <div className="wrap ct-desk__grid">
        <div className="ct-desk__main">
          <header className="ct-desk__head">
            <p className="eyebrow">
              <CmsText section="enquiry" field="eyebrow">{t("Arifa Packing & Packaging LLC")}</CmsText>
            </p>
            <h1 className="ct-title">
              <CmsText section="enquiry" field="heading" line="ct-line">
                <span className="ct-line">
                  <span>{t("Tell us what")}</span>
                </span>{' '}
                <span className="ct-line">
                  <span className="is-dim">{t("to pack.")}</span>
                </span>
              </CmsText>
            </h1>
            <p className="ct-lede">{t("Six quick answers. We write your enquiry up as you go, on a label ready for the packaging team.")}</p>
          </header>

          <form className="desk" id="contact" data-desk="" action={`mailto:${company.email}`} method="post" encType="text/plain" noValidate>
            <div className="desk__bar" aria-hidden="true">
              <span className="mono" data-desk-count="">
                01 / 06
              </span>
              <i className="desk__track">
                <b data-desk-progress=""></b>
              </i>
              <span className="mono desk__bar-name" data-desk-name="">
                {t("Contents")}
              </span>
            </div>

            <fieldset className="desk__step is-active" data-step="what" data-name={t("Contents")}>
              <legend className="desk__q">
                <span className="mono">01</span>{t("What should we pack for you?")}
              </legend>
              {/* the family panels from the products page, as picks: hover widens one, a tap selects it */}
              <div className="picks" data-fams="">
                <FamilyPicks />
              </div>
              <div className="desk__find">
                <label className="desk__small mono" htmlFor="d-find">
                  {t("Or add a product by its code or name")}
                </label>
                <div className="desk__findbox">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.5 4.5" />
                  </svg>
                  <input
                    id="d-find"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={t("e.g. 83185, cling film")}
                    data-find=""
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="false"
                    aria-controls="d-hits"
                  />
                </div>
                <ul className="desk__hits" id="d-hits" role="listbox" aria-label={t("Matching products")} data-hits="" hidden></ul>
              </div>
              <ul className="desk__picked" data-picked="" aria-label={t("Products in this enquiry")}></ul>
              <input type="hidden" name="detail" data-detail="" />
            </fieldset>

            <fieldset className="desk__step" data-step="much" data-name={t("Quantity")}>
              <legend className="desk__q">
                <span className="mono">02</span>{t("Roughly how much, and how often?")}
              </legend>
              <div className="desk__cards">
                <label className="dcard">
                  <input type="radio" name="size" value="Samples to try first" />
                  <span>
                    <b>{t("Samples")}</b>
                    <small>{t("to try first")}</small>
                  </span>
                </label>
                <label className="dcard">
                  <input type="radio" name="size" value="A few cartons" />
                  <span>
                    <b>{t("A few cartons")}</b>
                    <small>{t("a first order")}</small>
                  </span>
                </label>
                <label className="dcard">
                  <input type="radio" name="size" value="A pallet or more" />
                  <span>
                    <b>{t("A pallet or more")}</b>
                    <small>{t("regular stock")}</small>
                  </span>
                </label>
                <label className="dcard">
                  <input type="radio" name="size" value="Container loads" />
                  <span>
                    <b>{t("Container loads")}</b>
                    <small>{t("large volumes")}</small>
                  </span>
                </label>
              </div>
              <div className="dfield">
                <input id="d-qty" name="quantity" type="text" inputMode="numeric" placeholder=" " autoComplete="off" />
                <label htmlFor="d-qty">
                  {t("Exact quantity, if you know it")}{' '}<em>{t("cartons or pieces")}</em>
                </label>
              </div>
              <div className="desk__seg" role="radiogroup" aria-label={t("How often")}>
                <label>
                  <input type="radio" name="often" value="One-off" />
                  <span>{t("One-off")}</span>
                </label>
                <label>
                  <input type="radio" name="often" value="Every month" />
                  <span>{t("Every month")}</span>
                </label>
                <label>
                  <input type="radio" name="often" value="Every week" />
                  <span>{t("Every week")}</span>
                </label>
                <label>
                  <input type="radio" name="often" value="Not sure yet" />
                  <span>{t("Not sure yet")}</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="desk__step" data-step="where" data-name={t("Delivery")}>
              <legend className="desk__q">
                <span className="mono">03</span>{t("Where should it go?")}
              </legend>
              <div className="desk__seg" role="radiogroup" aria-label={t("Region")}>
                <label>
                  <input type="radio" name="region" value="Within the UAE" />
                  <span>{t("Within the UAE")}</span>
                </label>
                <label>
                  <input type="radio" name="region" value="Elsewhere in the GCC" />
                  <span>{t("Elsewhere in the GCC")}</span>
                </label>
                <label>
                  <input type="radio" name="region" value="Outside the GCC" />
                  <span>{t("Outside the GCC")}</span>
                </label>
              </div>
              <div className="dfield">
                <input id="d-city" name="city" type="text" placeholder=" " autoComplete="address-level2" />
                <label htmlFor="d-city">{t("City and country")}</label>
              </div>
            </fieldset>

            <fieldset className="desk__step" data-step="who" data-name={t("From")}>
              <legend className="desk__q">
                <span className="mono">04</span>{t("Who’s asking?")}
              </legend>
              <div className="desk__pair">
                <div className="dfield">
                  <input id="d-name" name="name" type="text" required placeholder=" " autoComplete="name" />
                  <label htmlFor="d-name">{t("Your name *")}</label>
                </div>
                <div className="dfield">
                  <input id="d-company" name="company" type="text" placeholder=" " autoComplete="organization" />
                  <label htmlFor="d-company">{t("Company")}</label>
                </div>
              </div>
              <p className="desk__small mono">{t("Your business")}</p>
              <div className="desk__seg" role="radiogroup" aria-label={t("Your business")}>
                <label>
                  <input type="radio" name="trade" value="Restaurant or cloud kitchen" />
                  <span>{t("Restaurant")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Catering" />
                  <span>{t("Catering")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Bakery or sweet shop" />
                  <span>{t("Bakery")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Hotel or hospitality" />
                  <span>{t("Hotel")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Retail or supermarket" />
                  <span>{t("Retail")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Distributor or trader" />
                  <span>{t("Distributor")}</span>
                </label>
                <label>
                  <input type="radio" name="trade" value="Other" />
                  <span>{t("Other")}</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="desk__step" data-step="reply" data-name={t("Reply")}>
              <legend className="desk__q">
                <span className="mono">05</span>{t("How should we reply?")}
              </legend>
              <div className="desk__cards desk__cards--3">
                <label className="dcard">
                  <input type="radio" name="channel" value="Email" defaultChecked />
                  <span>
                    <b>{t("Email")}</b>
                    <small>{t("a written quote")}</small>
                  </span>
                </label>
                <label className="dcard">
                  <input type="radio" name="channel" value="Phone call" />
                  <span>
                    <b>{t("Call me")}</b>
                    <small>{t("in working hours")}</small>
                  </span>
                </label>
                <label className="dcard">
                  <input type="radio" name="channel" value="WhatsApp" />
                  <span>
                    <b>{t("WhatsApp")}</b>
                    <small>{t("message me")}</small>
                  </span>
                </label>
              </div>
              <div className="desk__pair">
                <div className="dfield" data-need="email">
                  <input id="d-email" name="email" type="email" placeholder=" " autoComplete="email" />
                  <label htmlFor="d-email">
                    {t("Email")}{' '}<b data-req="">*</b>
                  </label>
                </div>
                <div className="dfield" data-need="phone">
                  <input id="d-phone" name="phone" type="tel" placeholder=" " autoComplete="tel" />
                  <label htmlFor="d-phone">
                    {t("Phone / WhatsApp")}{' '}
                    <b data-req="" hidden>
                      *
                    </b>
                  </label>
                </div>
              </div>
              {/* with the Arifa backend on: the two consents, separate and never pre-ticked; their exact
                  words go with the enquiry as the proof of consent (enquiryDeskClient.ts) */}
              {process.env.NEXT_PUBLIC_ARIFA_API_URL ? (
                <div className="desk__consent">
                  <label className="desk__tick">
                    <input type="checkbox" name="whatsapp_opt_in" />
                    <span data-consent="">{t("Send my quotation on WhatsApp")}</span>
                  </label>
                  <label className="desk__tick">
                    <input type="checkbox" name="email_opt_in" />
                    <span data-consent="">{t("Send my quotation by email")}</span>
                  </label>
                </div>
              ) : null}
            </fieldset>

            <fieldset className="desk__step" data-step="note" data-name={t("Notes")}>
              <legend className="desk__q">
                <span className="mono">06</span>{t("Anything else we should know?")}
              </legend>
              <div className="desk__chips" data-notes="">
                <label className="dchip dchip--plain">
                  <input type="checkbox" name="extra" value="Custom printing or branding" />
                  <span>{t("Custom printing or branding")}</span>
                </label>
                <label className="dchip dchip--plain">
                  <input type="checkbox" name="extra" value="Samples first" />
                  <span>{t("Samples first")}</span>
                </label>
                <label className="dchip dchip--plain">
                  <input type="checkbox" name="extra" value="Urgent timeline" />
                  <span>{t("Urgent timeline")}</span>
                </label>
                <label className="dchip dchip--plain">
                  <input type="checkbox" name="extra" value="A full price list" />
                  <span>{t("A full price list")}</span>
                </label>
              </div>
              <div className="dfield">
                <textarea id="d-msg" name="message" rows={3} placeholder=" "></textarea>
                <label htmlFor="d-msg">
                  {t("Sizes, printing, timeline…")}{' '}<em>{t("optional")}</em>
                </label>
              </div>
            </fieldset>

            <div className="desk__nav">
              <button type="button" className="desk__back mono" data-back="" hidden>
                {t("← Back")}
              </button>
              {/* phones: where you are, in the bar that stays at the foot of the screen */}
              <span className="desk__nav-step mono" data-desk-step="" aria-hidden="true">
                01 / 06
              </span>
              <button type="button" className="btn btn--leaf" data-next="">
                <span className="btn__text" data-text={t("Next")}>
                  {t("Next")}
                </span>
                <span className="btn__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
              <button type="submit" className="btn btn--leaf" data-send="">
                <span className="btn__text" data-text={t("Seal & send")}>
                  {t("Seal & send")}
                </span>
                <span className="btn__icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </button>
              <span className="desk__hint mono" data-hint="" aria-hidden="true">
                {t("or press Enter ↵")}
              </span>
            </div>
            <p className="desk__msg mono" data-msg="" role="status" aria-live="polite"></p>
          </form>

          <div className="desk__done" data-done="" hidden>
            <p className="eyebrow">
              <span className="mono">{t("Enquiry")}</span> <span data-done-ref=""></span>
            </p>
            <h2 className="desk__done-title" data-done-title="">{t("Sealed and ready.")}</h2>
            {/* sent to the Arifa backend: the reference it gave (enquiryDeskClient.ts) */}
            <p data-done-sent="" hidden>
              {t("We have your enquiry. The packaging team will reply during working hours, the way you chose.")}
            </p>
            <p data-done-mail="">
              {t("Your email app has opened with the enquiry written up and addressed to")}{' '}<span className="mono">{company.email}</span>{t(". Press send there, and the packaging team will reply during working hours.")}
            </p>
            <div className="desk__done-actions">
              <button type="button" className="btn btn--line" data-copy-enquiry="">
                <span className="btn__text" data-text={t("Copy the enquiry")}>
                  {t("Copy the enquiry")}
                </span>
              </button>
              <button type="button" className="link mono" data-restart="">
                {t("Start a new enquiry")}
              </button>
            </div>
            <p className="desk__msg mono" data-done-msg="" role="status" aria-live="polite"></p>
          </div>
        </div>

        {/* the carton label: prints line by line as the questions are answered; a line jumps back to its question */}
        <aside className="ct-label" aria-label={t("Your enquiry, written up")}>
          <div className="label" data-label="">
            <div className="label__tape" aria-hidden="true">
              <span>{t("ARIFA PACK · SEALED · ARIFA PACK · SEALED · ARIFA PACK · SEALED · ARIFA PACK · SEALED ·")}</span>
            </div>
            <header className="label__head">
              <img className="label__logo" src="/images/brand/arifa-logo.svg" alt="" width={96} height={52} />
              <div className="label__title">
                <b>{t("Enquiry")}</b>
                <span className="mono" data-ref="">
                  {t("AP-······-····")}
                </span>
              </div>
              <span className="label__up" aria-hidden="true" title={t("This way up")}>
                <svg viewBox="0 0 40 40">
                  <path d="M11 30V12M6 17l5-5 5 5M29 30V12M24 17l5-5 5 5" />
                  <path d="M5 34h30" />
                </svg>
              </span>
            </header>
            <div className="label__to">
              <span className="label__k">{t("To")}</span>
              <p>
                <b>{t("Arifa Packing & Packaging LLC")}</b>
                <br />
                {t("Al Jurf Industrial Area 2")}<br />
                {t("Ajman · United Arab Emirates")}
              </p>
            </div>
            <button type="button" className="label__row" data-goto="who">
              <span className="label__k">{t("From")}</span>
              <span className="label__v" data-v="from">
                <i>{t("Your name · company")}</i>
              </span>
            </button>
            <button type="button" className="label__row label__row--tall" data-goto="what">
              <span className="label__k">{t("Contents")}</span>
              <span className="label__v" data-v="what">
                <i>{t("Nothing packed yet")}</i>
              </span>
            </button>
            <div className="label__grid">
              <button type="button" className="label__row" data-goto="much">
                <span className="label__k">{t("Quantity")}</span>
                <span className="label__v" data-v="much">
                  <i>—</i>
                </span>
              </button>
              <button type="button" className="label__row" data-goto="much">
                <span className="label__k">{t("How often")}</span>
                <span className="label__v" data-v="often">
                  <i>—</i>
                </span>
              </button>
              <button type="button" className="label__row" data-goto="where">
                <span className="label__k">{t("Deliver to")}</span>
                <span className="label__v" data-v="where">
                  <i>—</i>
                </span>
              </button>
              <button type="button" className="label__row" data-goto="reply">
                <span className="label__k">{t("Reply by")}</span>
                <span className="label__v" data-v="reply">
                  <i>—</i>
                </span>
              </button>
            </div>
            <button type="button" className="label__row" data-goto="note">
              <span className="label__k">{t("Notes")}</span>
              <span className="label__v" data-v="note">
                <i>—</i>
              </span>
            </button>
            <footer className="label__foot">
              <svg className="label__barcode" data-barcode="" viewBox="0 0 320 54" preserveAspectRatio="none" aria-hidden="true" />
              <div className="label__meta mono">
                <span data-ref-foot="">{t("AP-······-····")}</span>
                <span>{t("Al Jurf · Ajman · UAE")}</span>
              </div>
            </footer>
            <div className="label__stamp" aria-hidden="true">
              <b>{t("Sealed")}</b>
              <span>{t("ready to send")}</span>
            </div>
          </div>
          <p className="ct-label__note mono">{t("Tap a line on the label to change it.")}</p>
        </aside>
      </div>
    </section>
  );
}
