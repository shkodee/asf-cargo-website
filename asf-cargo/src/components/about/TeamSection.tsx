import { useState } from 'react';
import { Users } from 'lucide-react';
import { useTeamRoster } from '../../hooks/useTeamRoster';
import SectionHeading from '../UI/SectionHeading';
import Reveal from '../UI/Reveal';
import TeamLightbox from './TeamLightbox';
import type { TeamMember } from '../../types';

export default function TeamSection() {
  const teamMembers = useTeamRoster();
  const [lightboxMember, setLightboxMember] = useState<TeamMember | null>(null);
  return (
    <section className="section" id="team">
      <div className="wrap">
        <SectionHeading eyebrow="Our Team" description="The people keeping ASF Cargo's freight — and drivers — moving.">
          Meet the team.
        </SectionHeading>

        {teamMembers.length === 0 ? (
          <Reveal className="team-empty">
            <Users className="w-6 h-6" />
            <p>Team roster coming soon.</p>
          </Reveal>
        ) : (
          <div className="team-marquee">
            <div className="team-track">
              {[...teamMembers, ...teamMembers].map((member, i) => (
                <div className="team-card" key={`${member.name}-${i}`}>
                  <button
                    type="button"
                    className="team-card-photo"
                    onClick={() => setLightboxMember(member)}
                    aria-label={`View larger photo of ${member.name}`}
                  >
                    <img src={member.image} alt={member.name} loading="lazy" />
                    <span className="team-card-hint">Click to enlarge</span>
                  </button>
                  <div className="team-card-info">
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                    {member.experience && <p className="team-card-exp">{member.experience}</p>}
                    {member.bio && <p className="team-card-bio">{member.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TeamLightbox member={lightboxMember} onClose={() => setLightboxMember(null)} />
    </section>
  );
}
