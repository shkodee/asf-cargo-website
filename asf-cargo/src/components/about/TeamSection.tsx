import { Users } from 'lucide-react';
import { teamMembers } from '../../data/content';
import SectionHeading from '../UI/SectionHeading';
import Reveal from '../UI/Reveal';

export default function TeamSection() {
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
                  <div className="team-card-photo">
                    <img src={member.image} alt={member.name} loading="lazy" />
                  </div>
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
    </section>
  );
}
