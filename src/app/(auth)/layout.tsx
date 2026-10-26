import { Brand } from "@/components/ui";
import { Icon } from "@/components/icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-main">
        <div className="stack gap-32" style={{ width: "100%", maxWidth: 400 }}>
          <Brand />
          {children}
        </div>
      </div>
      <aside className="auth-side" aria-hidden="true">
        <span className="pill" style={{ background: "rgba(255,255,255,.12)", color: "#fff", borderColor: "rgba(255,255,255,.2)", alignSelf: "flex-start", justifySelf: "start" }}>
          <b>Free</b> For founders, students and teams
        </span>
        <p className="display-l" style={{ color: "#fff", maxWidth: 520 }}>
          Every business starts as a <span className="italic">scribble</span>.
        </p>
        <ul className="stack gap-12" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 15.5, opacity: 0.92 }}>
          {[
            ["book", "A notebook that turns sparks into plans"],
            ["target", "Validation reports for any idea"],
            ["layers", "Projects with a progress bar per section"],
            ["users", "A community of people building too"],
          ].map(([icon, text]) => (
            <li key={text} className="row">
              <Icon name={icon} /> {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
