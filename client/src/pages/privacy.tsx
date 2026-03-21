import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      {
        heading: "Account Information",
        text: "When you register for TheHighGrader™, we collect your name, email address, role (student or teacher), and a hashed password. This information is necessary to create and manage your account.",
      },
      {
        heading: "Usage Data",
        text: "We automatically collect information about how you interact with our platform — including AI tutor sessions, quiz attempts, essay submissions, lecture notes, and assignment submissions. This data is used to personalize your experience and improve our services.",
      },
      {
        heading: "Content You Provide",
        text: "We store the content you submit — including essays, answers, photos for solving, and research queries — to provide AI-powered feedback. Teachers may also see submitted work as part of the grading workflow.",
      },
      {
        heading: "Device & Technical Data",
        text: "We collect standard technical information such as browser type, operating system, IP address, and session identifiers for security, analytics, and fraud prevention purposes.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      {
        heading: "Service Delivery",
        text: "We use your data to operate the platform — powering AI tutoring, quiz generation, essay grading, assignment evaluation, and class management features.",
      },
      {
        heading: "AI Processing",
        text: "Student-submitted content (essays, answers, questions) is processed by large language models (including OpenAI) to generate educational feedback, grades, and recommendations. We do not use your content to train third-party AI models without your consent.",
      },
      {
        heading: "Communication",
        text: "We may send you transactional emails (password resets, assignment notifications) and, with your consent, product updates. You can opt out of marketing emails at any time.",
      },
      {
        heading: "Platform Improvement",
        text: "Aggregated, anonymized usage data helps us improve features, fix bugs, and enhance the overall learning experience. No individually identifiable data is shared externally for this purpose.",
      },
    ],
  },
  {
    title: "3. Data Sharing & Disclosure",
    content: [
      {
        heading: "With Teachers",
        text: "In a class context, teachers can view their enrolled students' names, submitted assignments, AI scores, and teacher-pushed grades. Teachers cannot access student data outside their classes.",
      },
      {
        heading: "Service Providers",
        text: "We work with trusted third-party providers — including cloud hosting (Replit), AI processing (OpenAI), and database infrastructure — who process data on our behalf under strict data protection agreements.",
      },
      {
        heading: "Legal Requirements",
        text: "We may disclose your information if required by law, court order, or to protect the rights, safety, and security of TheHighGrader™, our users, or the public.",
      },
      {
        heading: "No Selling of Data",
        text: "We do not sell, rent, or trade your personal information to third parties for advertising or marketing purposes. Ever.",
      },
    ],
  },
  {
    title: "4. Data Retention",
    content: [
      {
        heading: "Account Data",
        text: "We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.",
      },
      {
        heading: "Submitted Content",
        text: "Assignment submissions, tutor sessions, and quiz attempts are retained to support your learning history. You may request export or deletion of this content.",
      },
    ],
  },
  {
    title: "5. Security",
    content: [
      {
        heading: "Technical Safeguards",
        text: "We use industry-standard security measures including HTTPS encryption, hashed passwords (bcrypt), session-based authentication, and server-side role verification to protect your data.",
      },
      {
        heading: "No Guarantee",
        text: "While we take security seriously, no system is entirely immune to threats. We encourage you to use a strong, unique password and to notify us immediately if you suspect unauthorized access.",
      },
    ],
  },
  {
    title: "6. Children's Privacy",
    content: [
      {
        heading: "COPPA Compliance",
        text: "TheHighGrader™ is designed for educational use and may be used by students of all ages. For users under 13 in the United States, we comply with the Children's Online Privacy Protection Act (COPPA). Schools and teachers using the platform are responsible for obtaining appropriate parental consent where required.",
      },
    ],
  },
  {
    title: "7. Your Rights",
    content: [
      {
        heading: "Access & Correction",
        text: "You have the right to access the personal data we hold about you and to request corrections to inaccurate information.",
      },
      {
        heading: "Deletion",
        text: "You may request deletion of your account and personal data. Certain data may be retained for legal or operational reasons.",
      },
      {
        heading: "Data Portability",
        text: "You may request an export of your data in a commonly used format.",
      },
      {
        heading: "GDPR / CCPA",
        text: "If you are located in the EU or California, you have additional rights under GDPR and CCPA respectively. Contact us to exercise these rights.",
      },
    ],
  },
  {
    title: "8. Cookies",
    content: [
      {
        heading: "Session Cookies",
        text: "We use session cookies to keep you logged in during a browsing session. These are essential for the platform to function and are deleted when you close your browser.",
      },
      {
        heading: "Analytics",
        text: "We may use privacy-respecting analytics tools to understand aggregate usage patterns. We do not use third-party advertising cookies.",
      },
    ],
  },
  {
    title: "9. Changes to This Policy",
    content: [
      {
        heading: "Updates",
        text: "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Your continued use of the platform after changes are posted constitutes acceptance of the updated policy.",
      },
    ],
  },
  {
    title: "10. Contact Us",
    content: [
      {
        heading: "Get in Touch",
        text: "If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at: privacy@thehighgrader.com",
      },
    ],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#070706] text-white">
      {/* Nav */}
      <header className="border-b border-white/5 bg-[#070706]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={logoPath} alt="TheHighGrader" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-[15px] text-white">TheHighGrader™</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-white/5 bg-gradient-to-b from-violet-950/20 to-transparent">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400/70 mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-[15px] text-white/40 max-w-xl leading-relaxed">
            We believe privacy is a right, not a feature. This policy explains exactly what data we collect, how we use it, and how we protect it.
          </p>
          <p className="mt-6 text-[12px] text-white/25">
            Last updated: March 21, 2026 &nbsp;·&nbsp; Effective: March 21, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar ToC */}
          <aside className="hidden lg:block">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 mb-4">Contents</p>
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.title}>
                  <a
                    href={`#${s.title.replace(/\s+/g, "-").toLowerCase()}`}
                    className="text-[12px] text-white/30 hover:text-white/70 transition-colors leading-relaxed block"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Body */}
          <div className="lg:col-span-3 space-y-12">
            {sections.map((section) => (
              <div key={section.title} id={section.title.replace(/\s+/g, "-").toLowerCase()}>
                <h2 className="text-[18px] font-semibold text-white mb-6 pb-3 border-b border-white/8">
                  {section.title}
                </h2>
                <div className="space-y-5">
                  {section.content.map((item) => (
                    <div key={item.heading}>
                      <h3 className="text-[13px] font-semibold text-violet-300/80 mb-1.5">{item.heading}</h3>
                      <p className="text-[14px] text-white/50 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070706] py-8">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/20">
            © {new Date().getFullYear()} TheHighGrader™. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[12px] text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
