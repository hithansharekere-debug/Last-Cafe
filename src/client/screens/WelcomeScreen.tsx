import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useNavigation } from '../context/NavigationContext';

export const WelcomeScreen = () => {
  const { navigateTo } = useNavigation();

  const rules = [
    {
      icon: '☕',
      title: 'One Token a Day',
      text: 'Visit daily to claim your coffee token. Each token lets you leave one meaningful contribution.',
    },
    {
      icon: '📝',
      title: 'Leave a Note',
      text: 'Spend your token to leave a memory, a piece of advice, or a secret for future visitors.',
    },
    {
      icon: '🔑',
      title: 'Unlock New Rooms',
      text: 'As the community contributes, new rooms slowly open — the Fireplace, the Library, the Garden.',
    },
    {
      icon: '⏳',
      title: 'Time Capsules',
      text: 'Leave a message that only unlocks on a future date. Your words wait patiently in the dark.',
    },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2]">
      {/* Hero section */}
      <div
        className="flex flex-col items-center justify-center py-8 px-6 text-center border-b-2 border-[#2c160a]"
        style={{ backgroundColor: '#f7edd7' }}
      >
        <div className="text-5xl mb-4 animate-float">☕</div>
        <h1 className="font-serif font-bold text-2xl text-[#2c160a] leading-tight mb-2">
          The Last Cafe<br />on the Internet
        </h1>
        <p className="font-serif text-sm text-[#5e463a] italic leading-relaxed max-w-xs">
          A quiet corner of Reddit where strangers leave something real for one another.
          Pull up a chair. Stay a while.
        </p>
        <div className="mt-6">
          <Button variant="primary" size="lg" onClick={() => navigateTo('cafe')}>
            Step Inside →
          </Button>
        </div>
      </div>

      {/* Rules section */}
      <div className="flex flex-col gap-3 p-4">
        <h2 className="font-serif font-bold text-base text-[#2c160a] px-1 flex items-center gap-2">
          <span>📋</span> How the Cafe Works
        </h2>
        {rules.map((rule) => (
          <Card key={rule.title} variant="napkin" elevation="low">
            <div className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0 mt-0.5">{rule.icon}</span>
              <div className="flex flex-col gap-1">
                <span className="font-serif font-bold text-sm text-[#26140b]">{rule.title}</span>
                <span className="font-serif text-xs text-[#5e463a] leading-relaxed">{rule.text}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Category teaser */}
      <div
        className="mx-4 mb-4 mt-1 rounded border-2 border-[#2c160a] p-4"
        style={{ backgroundColor: '#eeded1', boxShadow: '3px 3px 0px #2c160a' }}
      >
        <p className="font-serif text-xs text-[#5e463a] font-bold uppercase tracking-widest mb-3">
          You can leave…
        </p>
        <div className="flex flex-wrap gap-2">
          {['💭 Memory', '🌿 Advice', '🙏 Gratitude', '📚 Recommendation', '🤫 Secret', '⏳ Time Capsule'].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-serif rounded border border-[#2c160a] bg-[#fdfaf2] text-[#2c160a]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigate to discover */}
      <div className="px-4 pb-6 text-center">
        <button
          onClick={() => navigateTo('discover')}
          className="font-serif text-xs text-[#5e463a] italic underline underline-offset-2 hover:text-[#2c160a] transition-colors"
        >
          Read what others have left →
        </button>
      </div>
    </div>
  );
};
