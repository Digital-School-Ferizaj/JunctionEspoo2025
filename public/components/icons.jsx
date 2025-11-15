const featherIcons = window.ReactFeather || {};
const {
    Shield,
    Heart,
    Calendar,
    BookOpen,
    Users,
    Star,
    Activity,
    Droplet,
    PlusCircle,
    Phone,
    Menu,
    Send,
    Save,
    AlertTriangle,
    Sun,
    Moon,
    X,
    MessageCircle,
    UserCheck,
    Leaf,
    Bookmark,
} = featherIcons;

const ICON_PROPS = { size: 24, strokeWidth: 1.8 };
const createIcon = (Component, extraProps = {}) => {
    if (!Component) {
        return () => null;
    }
    return (props = {}) => <Component {...ICON_PROPS} {...extraProps} {...props} />;
};

const ShieldIcon = createIcon(Shield);
const HeartIcon = createIcon(Heart);
const CalendarIcon = createIcon(Calendar);
const BookOpenIcon = createIcon(BookOpen);
const UsersIcon = createIcon(Users);
const SparklesIcon = createIcon(Star);
const ActivityIcon = createIcon(Activity);
const DropletsIcon = createIcon(Droplet);
const PillIcon = createIcon(PlusCircle);
const PhoneIcon = createIcon(Phone, { size: 20 });
const MenuIcon = createIcon(Menu);
const SendIcon = createIcon(Send, { size: 20 });
const SaveIcon = createIcon(Save, { size: 20 });
const AlertTriangleIcon = createIcon(AlertTriangle);
const SunIcon = createIcon(Sun);
const MoonIcon = createIcon(Moon);
const XIcon = createIcon(X);
const ChatBubbleIcon = createIcon(MessageCircle);
const BuddyIcon = createIcon(UserCheck);
const WellnessLeafIcon = createIcon(Leaf);
const MemorySparkIcon = createIcon(Bookmark);

window.AmilyIcons = {
    ShieldIcon,
    HeartIcon,
    CalendarIcon,
    BookOpenIcon,
    UsersIcon,
    SparklesIcon,
    ActivityIcon,
    DropletsIcon,
    PillIcon,
    PhoneIcon,
    MenuIcon,
    SendIcon,
    SaveIcon,
    AlertTriangleIcon,
    SunIcon,
    MoonIcon,
    XIcon,
    ChatBubbleIcon,
    BuddyIcon,
    WellnessLeafIcon,
    MemorySparkIcon,
};
