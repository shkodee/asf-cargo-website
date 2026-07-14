import { useState } from 'react';
import type { FormEvent } from 'react';
import { experienceOptions, positionOptions, coDriverOptions, company } from '../../data/content';
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
  coDriverCdlNumber: '',
  coDriverCdlState: '',
  coDriverExperience: '',
};

type Status = { type: 'ok' | 'err'; message: string } | null;

export default function ApplicationForm() {
  const [form, setForm] = useState<ApplicationPayload>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  function update<K extends keyof ApplicationPayload>(key: K, value: ApplicationPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
      coDriverCdlNumber: value === coDriverOptions[0] ? f.coDriverCdlNumber : '',
      coDriverCdlState: value === coDriverOptions[0] ? f.coDriverCdlState : '',
      coDriverExperience: value === coDriverOptions[0] ? f.coDriverExperience : '',
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitApplication(form);
      setForm(initialForm);
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
        <div className="form-row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              type="text"
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              placeholder="(555) 555-5555"
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
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
          <div className="field">
            <label htmlFor="city">Current city / state</label>
            <input
              type="text"
              id="city"
              placeholder="e.g. Memphis, TN"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </div>
        </div>

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
              <div className="field">
                <label htmlFor="coDriverPhone">Co-driver phone</label>
                <input
                  type="tel"
                  id="coDriverPhone"
                  placeholder="(555) 555-5555"
                  value={form.coDriverPhone}
                  onChange={(e) => update('coDriverPhone', e.target.value)}
                />
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
