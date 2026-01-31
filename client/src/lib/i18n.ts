export type Language = 'en' | 'ru';

export const translations = {
  en: {
    // App
    appName: 'Myntraq',
    tagline: 'Secure messaging for everyone',
    
    // Auth
    login: 'Log In',
    logout: 'Log Out',
    welcome: 'Welcome',
    welcomeBack: 'Welcome back',
    
    // Landing
    heroTitle: 'Connect Instantly.',
    heroSubtitle: 'Fast, secure, and beautiful messaging.',
    getStarted: 'Get Started',
    features: 'Features',
    
    // Features
    feature1Title: 'Real-time Messaging',
    feature1Desc: 'Instant message delivery with typing indicators',
    feature2Title: 'Secure & Private',
    feature2Desc: 'Your conversations are protected',
    feature3Title: 'Cross-Platform',
    feature3Desc: 'Works on web, iOS, and Android',
    
    // Chat
    chats: 'Chats',
    messages: 'Messages',
    newChat: 'New Chat',
    searchUsers: 'Search users...',
    typeMessage: 'Type a message...',
    send: 'Send',
    noChats: 'No chats yet',
    startChatting: 'Start a conversation',
    noMessages: 'No messages yet',
    sendFirstMessage: 'Send your first message',
    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Last seen',
    today: 'today',
    yesterday: 'yesterday',
    
    // Profile
    profile: 'Profile',
    settings: 'Settings',
    editProfile: 'Edit Profile',
    displayName: 'Display Name',
    bio: 'Bio',
    tag: 'Tag',
    language: 'Language',
    save: 'Save',
    cancel: 'Cancel',
    
    // Search
    search: 'Search',
    searchResults: 'Search Results',
    noResults: 'No users found',
    startChat: 'Start Chat',
    
    // Friends
    friends: 'Friends',
    addFriend: 'Add Friend',
    friendRequests: 'Friend Requests',
    accept: 'Accept',
    reject: 'Reject',
    pending: 'Pending',
    
    // Groups & Channels
    newGroup: 'New Group',
    newChannel: 'New Channel',
    createGroup: 'Create Group',
    createChannel: 'Create Channel',
    groupName: 'Group name',
    channelName: 'Channel name',
    description: 'Description',
    addMembers: 'Add Members',
    members: 'members',
    subscriber: 'subscriber',
    subscribers: 'subscribers',
    group: 'Group',
    channel: 'Channel',
    private: 'Private',
    youAreAdmin: 'You are an admin',
    onlyAdminsCanPost: 'Only admins can post here',
    groupSettings: 'Group Settings',
    channelSettings: 'Channel Settings',
    editGroup: 'Edit Group',
    editChannel: 'Edit Channel',
    deleteGroup: 'Delete Group',
    deleteChannel: 'Delete Channel',
    deleteGroupConfirm: 'Are you sure you want to delete this group? All messages will be lost.',
    deleteChannelConfirm: 'Are you sure you want to delete this channel? All messages will be lost.',
    leaveGroup: 'Leave Group',
    leaveChannel: 'Leave Channel',
    manageMembers: 'Manage Members',
    makeAdmin: 'Make Admin',
    removeAdmin: 'Remove Admin',
    removeMember: 'Remove',
    admin: 'Admin',
    member: 'Member',
    creator: 'Creator',
    changeIcon: 'Change Icon',
    
    // Attachments
    attachFile: 'Attach file',
    attachPhoto: 'Photo',
    attachVideo: 'Video',
    attachVoice: 'Voice message',
    recording: 'Recording...',
    stopRecording: 'Stop',
    sendVoice: 'Send voice message',
    uploadingFile: 'Uploading...',
    fileTooLarge: 'File is too large',
    unsupportedFormat: 'Unsupported format',
    
    // Errors
    error: 'Error',
    tryAgain: 'Try Again',
    somethingWrong: 'Something went wrong',
    
    // Time
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'h ago',
  },
  ru: {
    // App
    appName: 'Myntraq',
    tagline: 'Безопасный мессенджер для всех',
    
    // Auth
    login: 'Войти',
    logout: 'Выйти',
    welcome: 'Добро пожаловать',
    welcomeBack: 'С возвращением',
    
    // Landing
    heroTitle: 'Общайтесь мгновенно.',
    heroSubtitle: 'Быстрый, безопасный и красивый мессенджер.',
    getStarted: 'Начать',
    features: 'Возможности',
    
    // Features
    feature1Title: 'Мгновенные сообщения',
    feature1Desc: 'Моментальная доставка с индикаторами набора',
    feature2Title: 'Безопасность',
    feature2Desc: 'Ваши разговоры защищены',
    feature3Title: 'Кроссплатформенность',
    feature3Desc: 'Работает на веб, iOS и Android',
    
    // Chat
    chats: 'Чаты',
    messages: 'Сообщения',
    newChat: 'Новый чат',
    searchUsers: 'Поиск пользователей...',
    typeMessage: 'Введите сообщение...',
    send: 'Отправить',
    noChats: 'Нет чатов',
    startChatting: 'Начните общение',
    noMessages: 'Нет сообщений',
    sendFirstMessage: 'Отправьте первое сообщение',
    online: 'В сети',
    offline: 'Не в сети',
    lastSeen: 'Был(а)',
    today: 'сегодня',
    yesterday: 'вчера',
    
    // Profile
    profile: 'Профиль',
    settings: 'Настройки',
    editProfile: 'Редактировать профиль',
    displayName: 'Имя',
    bio: 'О себе',
    tag: 'Тег',
    language: 'Язык',
    save: 'Сохранить',
    cancel: 'Отмена',
    
    // Search
    search: 'Поиск',
    searchResults: 'Результаты поиска',
    noResults: 'Пользователи не найдены',
    startChat: 'Начать чат',
    
    // Friends
    friends: 'Друзья',
    addFriend: 'Добавить друга',
    friendRequests: 'Заявки в друзья',
    accept: 'Принять',
    reject: 'Отклонить',
    pending: 'Ожидание',
    
    // Groups & Channels
    newGroup: 'Новая группа',
    newChannel: 'Новый канал',
    createGroup: 'Создать группу',
    createChannel: 'Создать канал',
    groupName: 'Название группы',
    channelName: 'Название канала',
    description: 'Описание',
    addMembers: 'Добавить участников',
    members: 'участников',
    subscriber: 'подписчик',
    subscribers: 'подписчиков',
    group: 'Группа',
    channel: 'Канал',
    private: 'Личный',
    youAreAdmin: 'Вы администратор',
    onlyAdminsCanPost: 'Только администраторы могут писать',
    groupSettings: 'Настройки группы',
    channelSettings: 'Настройки канала',
    editGroup: 'Редактировать группу',
    editChannel: 'Редактировать канал',
    deleteGroup: 'Удалить группу',
    deleteChannel: 'Удалить канал',
    deleteGroupConfirm: 'Вы уверены, что хотите удалить эту группу? Все сообщения будут потеряны.',
    deleteChannelConfirm: 'Вы уверены, что хотите удалить этот канал? Все сообщения будут потеряны.',
    leaveGroup: 'Покинуть группу',
    leaveChannel: 'Покинуть канал',
    manageMembers: 'Управление участниками',
    makeAdmin: 'Сделать админом',
    removeAdmin: 'Снять админа',
    removeMember: 'Удалить',
    admin: 'Админ',
    member: 'Участник',
    creator: 'Создатель',
    changeIcon: 'Изменить иконку',
    
    // Attachments
    attachFile: 'Прикрепить файл',
    attachPhoto: 'Фото',
    attachVideo: 'Видео',
    attachVoice: 'Голосовое сообщение',
    recording: 'Запись...',
    stopRecording: 'Стоп',
    sendVoice: 'Отправить голосовое',
    uploadingFile: 'Загрузка...',
    fileTooLarge: 'Файл слишком большой',
    unsupportedFormat: 'Неподдерживаемый формат',
    
    // Errors
    error: 'Ошибка',
    tryAgain: 'Попробовать снова',
    somethingWrong: 'Что-то пошло не так',
    
    // Time
    justNow: 'Только что',
    minutesAgo: 'мин назад',
    hoursAgo: 'ч назад',
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang][key] || translations.en[key] || key;
}

export function formatTime(date: Date, lang: Language = 'en'): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return t('justNow', lang);
  if (minutes < 60) return `${minutes} ${t('minutesAgo', lang)}`;
  if (hours < 24) return `${hours} ${t('hoursAgo', lang)}`;
  
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');
}
