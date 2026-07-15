import { useState } from 'react';
import type { FormEvent } from 'react';
import { experienceOptions, positionOptions, coDriverOptions, company, usCitySuggestions } from '../../data/content';
import { submitApplication } from '../../api/apply';
import type { ApplicationPayload } from '../../types';
import Reveal from '../UI/Reveal';

const initialForm: ApplicationPayload = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  position: positionOptions[0],
  cdlNumber: '',
  cdlState: '',
  experience: experienceOptions[0],
  city: '',
  message: '',
  hasCoDriver: '',
  coDriverFirstName: '',
  coDriverLastName: '',
  coDriverPhone: '',
  coDriverEmail: '',
  coDriverCity: '',
  coDriverCdlNumber: '',
  coDriverCdlState: '',
  coDriverExperience: '',
  website: '',
};

type Status = { type: 'ok' | 'err'; message: string } | null;
type Errors = Partial<Record<keyof ApplicationPayload, string>>;

const REQUIRED_FIELDS: { key: keyof ApplicationPayload; label: string }[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone' },
];

// Order matters here — it's the order errors are checked/focused in on submit.
const VALIDATED_FIELD_ORDER: (keyof ApplicationPayload)[] = [
  'firstName', 'lastName', 'phone', 'email', 'city',
  'coDriverPhone', 'coDriverEmail', 'coDriverCity',
];

const cityLookup = new Set(usCitySuggestions.map((c) => c.toLowerCase()));

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

// Formats as the user types, e.g. "(555) 555-5555" — also the mechanism that
// keeps the field to digits only, since anything non-numeric gets stripped.
function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isKnownCity(value: string): boolean {
  return cityLookup.has(value.trim().toLowerCase());
}

const CDL_MAX_BYTES = 8 * 1024 * 1024;
const CDL_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function ApplicationForm() {
  const [form, setForm] = useState<ApplicationPayload>(initialForm);
  const [cdlFile, setCdlFile] = useState<File | null>(null);
  const [cdlFileError, setCdlFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<Errors>({});

  function handleCdlFileChange(fileList: FileList | null) {
    const file = fileList?.[0] || null;
    if (!file) {
      setCdlFile(null);
      setCdlFileError(null);
      return;
    }
    if (!CDL_ALLOWED_TYPES.includes(file.type)) {
      setCdlFile(null);
      setCdlFileError('File must be a JPEG, PNG, WEBP, or PDF.');
      return;
    }
    if (file.size > CDL_MAX_BYTES) {
      setCdlFile(null);
      setCdlFileError('File must be under 8MB.');
      return;
    }
    setCdlFile(file);
    setCdlFileError(null);
  }

  function update<K extends keyof ApplicationPayload>(key: K, value: ApplicationPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function updatePosition(value: string) {
    setForm((f) => ({
      ...f,
      position: value,
      // clear co-driver answers if switching away from Team Driver
      hasCoDriver: value === 'Team Driver' ? f.hasCoDriver : '',
      coDriverFirstName: value === 'Team Driver' ? f.coDriverFirstName : '',
      coDriverLastName: value === 'Team Driver' ? f.coDriverLastName : '',
      coDriverPhone: value === 'Team Driver' ? f.coDriverPhone : '',
      coDriverEmail: value === 'Team Driver' ? f.coDriverEmail : '',
      coDriverCity: value === 'Team Driver' ? f.coDriverCity : '',
      coDriverCdlNumber: value === 'Team Driver' ? f.coDriverCdlNumber : '',
      coDriverCdlState: value === 'Team Driver' ? f.coDriverCdlState : '',
      coDriverExperience: value === 'Team Driver' ? f.coDriverExperience : '',
    }));
  }

  function updateHasCoDriver(value: string) {
    setForm((f) => ({
      ...f,
      hasCoDriver: value,
      // clear co-driver info if switching to "need one" or re-toggling
      coDriverFirstName: value === coDriverOptions[0] ? f.coDriverFirstName : '',
      coDriverLastName: value === coDriverOptions[0] ? f.coDriverLastName : '',
      coDriverPhone: value === coDriverOptions[0] ? f.coDriverPhone : '',
      coDriverEmail: value === coDriverOptions[0] ? f.coDriverEmail : '',
      coDriverCity: value === coDriverOptions[0] ? f.coDriverCity : '',
      coDriverCdlNumber: value === coDriverOptions[0] ? f.coDriverCdlNumber : '',
      coDriverCdlState: value === coDriverOptions[0] ? f.coDriverCdlState : '',
      coDriverExperience: value === coDriverOptions[0] ? f.coDriverExperience : '',
    }));
  }

  function validate(): Errors {
    const next: Errors = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!form[key].trim()) next[key] = `${label} is required.`;
    }
    if (!next.phone && digitsOnly(form.phone).length !== 10) {
      next.phone = 'Enter a valid 10-digit phone number.';
    }
    if (form.email && !isValidEmail(form.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (form.city && !isKnownCity(form.city)) {
      next.city = 'Select a city from the list.';
    }
    if (form.hasCoDriver === coDriverOptions[0]) {
      if (form.coDriverPhone && digitsOnly(form.coDriverPhone).length !== 10) {
        next.coDriverPhone = 'Enter a valid 10-digit phone number.';
      }
      if (form.coDriverEmail && !isValidEmail(form.coDriverEmail)) {
        next.coDriverEmail = 'Enter a valid email address.';
      }
      if (form.coDriverCity && !isKnownCity(form.coDriverCity)) {
        next.coDriverCity = 'Select a city from the list.';
      }
    }
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus({ type: 'err', message: 'Please fix the highlighted fields below.' });
      const firstInvalidKey = VALIDATED_FIELD_ORDER.find((key) => validationErrors[key]);
      if (firstInvalidKey) {
        document.getElementById(firstInvalidKey)?.focus();
      }
      return;
    }
    if (form.website) {
      // Honeypot tripped — pretend success without actually submitting.
      setForm(initialForm);
      setErrors({});
      setCdlFile(null);
      setStatus({ type: 'ok', message: "Application received — we'll be in touch soon. Thank you!" });
      return;
    }
    setSubmitting(true);
    try {
      await submitApplication(form, cdlFile);
      setForm(initialForm);
      setErrors({});
      setCdlFile(null);
      setStatus({ type: 'ok', message: "Application received — we'll be in touch soon. Thank you!" });
    } catch {
      setStatus({
        type: 'err',
        message: `Something went wrong sending your application. Please call us at ${company.officePhone} instead.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Reveal as="form" className="form-wrap" id="applyForm" onSubmit={handleSubmit}>
        <datalist id="city-suggestions">
          {usCitySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="honeypot-field" aria-hidden="true">
          <label htmlFor="website">Leave this field blank</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className={`field${errors.firstName ? ' invalid' : ''}`}>
            <label htmlFor="firstName">First name</label>
            <input
              type="text"
              id="firstName"
              required
              aria-invalid={!!errors.firstName}
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            {errors.firstName && <p className="field-error">{errors.firstName}</p>}
          </div>
          <div className={`field${errors.lastName ? ' invalid' : ''}`}>
            <label htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              required
              aria-invalid={!!errors.lastName}
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
            {errors.lastName && <p className="field-error">{errors.lastName}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className={`field${errors.phone ? ' invalid' : ''}`}>
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              placeholder="(555) 555-5555"
              inputMode="numeric"
              required
              aria-invalid={!!errors.phone}
              value={form.phone}
              onChange={(e) => update('phone', formatPhone(e.target.value))}
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div className={`field${errors.email ? ' invalid' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cdlNumber">CDL number</label>
            <input
              type="text"
              id="cdlNumber"
              value={form.cdlNumber}
              onChange={(e) => update('cdlNumber', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cdlState">CDL issuing state</label>
            <input
              type="text"
              id="cdlState"
              placeholder="e.g. VA"
              value={form.cdlState}
              onChange={(e) => update('cdlState', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row single">
          <div className={`field${cdlFileError ? ' invalid' : ''}`}>
            <label htmlFor="cdlFile">CDL photo or document (optional)</label>
            <input
              type="file"
              id="cdlFile"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleCdlFileChange(e.target.files)}
            />
            {cdlFileError && <p className="field-error">{cdlFileError}</p>}
            {cdlFile && !cdlFileError && <p className="field-hint">Selected: {cdlFile.name}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="experience">Years of driving experience</label>
            <select
              id="experience"
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
            >
              {experienceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className={`field${errors.city ? ' invalid' : ''}`}>
            <label htmlFor="city">Current city / state</label>
            <input
              type="text"
              id="city"
              list="city-suggestions"
              placeholder="e.g. Memphis, TN"
              autoComplete="off"
              aria-invalid={!!errors.city}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
            {errors.city && <p className="field-error">{errors.city}</p>}
          </div>
        </div>

        <div className="form-row single">
          <div className="field">
            <label>Position you&apos;re applying for</label>
            <div className="radio-group">
              {positionOptions.map((opt) => (
                <label className="radio-pill" key={opt}>
                  <input
                    type="radio"
                    name="position"
                    value={opt}
                    checked={form.position === opt}
                    onChange={() => updatePosition(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {form.position === 'Team Driver' && (
          <div className="form-row single">
            <div className="field">
              <label>Do you have a co-driver?</label>
              <div className="radio-group">
                {coDriverOptions.map((opt) => (
                  <label className="radio-pill" key={opt}>
                    <input
                      type="radio"
                      name="hasCoDriver"
                      value={opt}
                      checked={form.hasCoDriver === opt}
                      onChange={() => updateHasCoDriver(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {form.hasCoDriver === coDriverOptions[0] && (
          <>
            <div className="form-row single">
              <div className="field">
                <label className="mono" style={{ color: 'var(--navy)', fontWeight: 600 }}>Co-driver information</label>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="coDriverFirstName">Co-driver first name</label>
                <input
                  type="text"
                  id="coDriverFirstName"
                  value={form.coDriverFirstName}
                  onChange={(e) => update('coDriverFirstName', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="coDriverLastName">Co-driver last name</label>
                <input
                  type="text"
                  id="coDriverLastName"
                  value={form.coDriverLastName}
                  onChange={(e) => update('coDriverLastName', e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className={`field${errors.coDriverPhone ? ' invalid' : ''}`}>
                <label htmlFor="coDriverPhone">Co-driver phone</label>
                <input
                  type="tel"
                  id="coDriverPhone"
                  placeholder="(555) 555-5555"
                  inputMode="numeric"
                  aria-invalid={!!errors.coDriverPhone}
                  value={form.coDriverPhone}
                  onChange={(e) => update('coDriverPhone', formatPhone(e.target.value))}
                />
                {errors.coDriverPhone && <p className="field-error">{errors.coDriverPhone}</p>}
              </div>
              <div className="field">
                <label htmlFor="coDriverExperience">Co-driver years of experience</label>
                <select
                  id="coDriverExperience"
                  value={form.coDriverExperience}
                  onChange={(e) => update('coDriverExperience', e.target.value)}
                >
                  <option value="">Select...</option>
                  {experienceOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className={`field${errors.coDriverEmail ? ' invalid' : ''}`}>
                <label htmlFor="coDriverEmail">Co-driver email</label>
                <input
                  type="email"
                  id="coDriverEmail"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.coDriverEmail}
                  value={form.coDriverEmail}
                  onChange={(e) => update('coDriverEmail', e.target.value)}
                />
                {errors.coDriverEmail && <p className="field-error">{errors.coDriverEmail}</p>}
              </div>
              <div className={`field${errors.coDriverCity ? ' invalid' : ''}`}>
                <label htmlFor="coDriverCity">Co-driver current city / state</label>
                <input
                  type="text"
                  id="coDriverCity"
                  list="city-suggestions"
                  placeholder="e.g. Memphis, TN"
                  autoComplete="off"
                  aria-invalid={!!errors.coDriverCity}
                  value={form.coDriverCity}
                  onChange={(e) => update('coDriverCity', e.target.value)}
                />
                {errors.coDriverCity && <p className="field-error">{errors.coDriverCity}</p>}
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="coDriverCdlNumber">Co-driver CDL number</label>
                <input
                  type="text"
                  id="coDriverCdlNumber"
                  value={form.coDriverCdlNumber}
                  onChange={(e) => update('coDriverCdlNumber', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="coDriverCdlState">Co-driver CDL issuing state</label>
                <input
                  type="text"
                  id="coDriverCdlState"
                  placeholder="e.g. VA"
                  value={form.coDriverCdlState}
                  onChange={(e) => update('coDriverCdlState', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="form-row single">
          <div className="field">
            <label htmlFor="message">Anything we should know?</label>
            <textarea
              id="message"
              placeholder="Preferred start date, questions, driving partner's name if applying as a team, etc."
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
        <p className="form-note">
          By submitting, you agree that {company.name} may contact you by phone, text, or email about this application.
        </p>

        {status && (
          <div className={`form-status show ${status.type}`}>{status.message}</div>
        )}
    </Reveal>
  );
}
