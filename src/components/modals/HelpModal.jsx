import Modal from "@/components/ui/Modal";

const HELP_CARDS = [
  {
    icon: "⌨️",
    title: "Command Bar",
    desc: "Type a prefix + search: yt lo-fi → YouTube, gh react → GitHub, g laptops → Google. Hit Enter to go.",
  },
  {
    icon: "✦",
    title: "AI Routing",
    desc: 'No prefix needed. Just type naturally — "best running shoes to buy" — and Navix AI picks the best destination.',
  },
  {
    icon: "⚡",
    title: "Quick Prefixes",
    desc: "g Google · yt YouTube · gh GitHub · rd Reddit · ig Instagram · maps Maps · wiki Wikipedia · and more.",
  },
  {
    icon: "➕",
    title: "Add Custom Sites",
    desc: "Click + in the header. Enter a name and URL — the search URL is resolved automatically via AI.",
  },
  {
    icon: "🎨",
    title: "Themes & Fonts",
    desc: "Open Settings ⚙ to choose from 7 colour themes and 5 font styles. Your choices sync to your account.",
  },
  {
    icon: "🔒",
    title: "Basic vs Dev",
    desc: "Basic Mode protects built-in URLs. Dev Mode (footer toggle) lets you edit search URLs and delete any site.",
  },
  {
    icon: "☁️",
    title: "Cloud Sync",
    desc: "Your shortcuts and settings sync to your account automatically — available on every device you sign into.",
  },
  {
    icon: "⇄",
    title: "Rearrange",
    desc: "Click Rearrange above Quick Launch to drag sites into order and toggle which ones appear in Quick Launch.",
  },
];

export default function HelpModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="How to use Navix" wide>
      <div className="font-app grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {HELP_CARDS.map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-[0.55rem] rounded-[14px] border-[1.5px] border-app bg-app-3 p-5"
          >
            <div className="text-[1.5rem]">{card.icon}</div>
            <div className="text-[0.88rem] font-semibold text-app">
              {card.title}
            </div>
            <div className="text-[0.78rem] leading-[1.65] text-app-2">
              {card.desc}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
