(function () {
  'use strict';

  var WA_URL = 'https://wa.me/8617751189576';

  var I18N = {
    en: {
      title: 'KIWL Support',
      subtitle: 'Quantang Group · Online',
      greeting: 'Hello! Welcome to KIWL (Quantang Group). 👋',
      intro: 'We are a professional injection molding solution provider established in 2002, integrating R&D, production, sales, and service. We design and manufacture hydraulic servo, electric, specialized, and two-platen injection molding machines for industries worldwide.',
      menuPrompt: 'What would you like to know about us?',
      btnProducts: 'Our Products',
      btnApplications: 'Applications',
      btnAbout: 'About KIWL',
      btnSales: 'Talk to Sales',
      btnBack: 'Main Menu',
      replyProducts: 'Our product range includes:\n\n• Hydraulic servo injection molding machines (SK, SKII, S, J6, V series)\n• All-electric injection molding machines (SE series)\n• Hybrid injection machines (SK-HYB series)\n• Specialized machines (medical, high-speed SH, nylon cable tie NS, etc.)\n• Two-platen injection molding machines\n\nEach series is engineered for precision, energy efficiency, and reliable production.',
      replyApplications: 'KIWL machines serve diverse industries:\n\n• Automotive parts\n• Medical equipment\n• Daily consumer goods\n• Electronics & home appliances\n• Packaging & logistics\n• Shoe materials & stationery\n\nWe provide tailored injection molding solutions for your specific application.',
      replyAbout: 'Shanghai Quantang Ecological Technology Group Co., Ltd. (KIWL) has been a trusted brand since 2002. With a dedicated R&D team, we continuously innovate in intelligent equipment and rubber & plastic machinery.\n\nOur mission: bringing value to customers and creating happiness for employees.',
      replySales: 'Great choice! Our sales manager is ready to help you with quotes, technical details, and customized solutions.',
      waPrompt: 'Click below to chat with our sales manager on WhatsApp:',
      waBtn: 'Chat on WhatsApp',
      waPrefill: 'Hello, I found you through www.plasticmoldinghub.com and would like to inquire about KIWL injection molding machines.',
      ariaOpen: 'Open chat',
      ariaClose: 'Close chat'
    },
    ar: {
      title: 'دعم KIWL',
      subtitle: 'مجموعة تشيوان تانغ · متصل',
      greeting: 'مرحباً! أهلاً بكم في KIWL (مجموعة تشيوان تانغ). 👋',
      intro: 'نحن مزود محترف لحلول حقن البلاستيك، تأسست شركتنا عام 2002، ونجمع بين البحث والتطوير والإنتاج والمبيعات وخدمة ما بعد البيع. نصمّم ونصنع آلات حقن هيدروليكية بخادم، وآلات حقن كهربائية، وسلسلة آلات متخصصة، وآلات حقن ثنائية اللوحة للصناعات حول العالم.',
      menuPrompt: 'بماذا يمكنني مساعدتك اليوم؟',
      btnProducts: 'منتجاتنا',
      btnApplications: 'التطبيقات الصناعية',
      btnAbout: 'عن KIWL',
      btnSales: 'التحدث مع المبيعات',
      btnBack: 'القائمة الرئيسية',
      replyProducts: 'تشمل مجموعة منتجاتنا:\n\n• آلات حقن هيدروليكية بخادم (سلسلة SK، SKII، S، J6، V)\n• آلات حقن كهربائية بالكامل (سلسلة SE)\n• آلات حقن هجينة (سلسلة SK-HYB)\n• آلات متخصصة (معدات طبية، SH عالية السرعة، NS لروابط الكابلات النايلونية، إلخ)\n• آلات حقن ثنائية اللوحة\n\nكل سلسلة مصممة للدقة وكفاءة الطاقة والإنتاج الموثوق.',
      replyApplications: 'تخدم آلات KIWL صناعات متنوعة:\n\n• قطع غيار السيارات\n• المعدات الطبية\n• السلع الاستهلاكية اليومية\n• الإلكترونيات والأجهزة المنزلية\n• التعبئة والتغليف واللوجستيات\n• مواد الأحذية والقرطاسية\n\nنوفر حلول حقن مخصصة لتطبيقكم.',
      replyAbout: 'شركة شنغهاي تشيوان تانغ للتكنولوجيا البيئية القابضة المحدودة (KIWL) علامة تجارية موثوقة منذ عام 2002. بفريق بحث وتطوير متخصص، نبتكر باستمرار في المعدات الذكية وآلات المطاط والبلاستيك.\n\nمهمتنا: تقديم قيمة للعملاء وخلق السعادة للموظفين.',
      replySales: 'اختيار ممتاز! مدير المبيعات لدينا جاهز لمساعدتك في عروض الأسعار والتفاصيل الفنية والحلول المخصصة.',
      waPrompt: 'انقر أدناه للتحدث مع مدير المبيعات عبر واتساب:',
      waBtn: 'التواصل عبر واتساب',
      waPrefill: 'مرحباً، أود الاستفسار عن آلات حقن KIWL.',
      ariaOpen: 'فتح المحادثة',
      ariaClose: 'إغلاق المحادثة'
    }
  };

  function getLang() {
    var html = document.documentElement;
    if (html.lang === 'ar' || html.getAttribute('dir') === 'rtl') return 'ar';
    return 'en';
  }

  function waLink(text) {
    return WA_URL + '?text=' + encodeURIComponent(text);
  }

  function createWidget(t) {
    var root = document.createElement('div');
    root.id = 'kiwl-chat-root';
    root.innerHTML =
      '<button type="button" class="kiwl-chat-toggle" aria-label="' + t.ariaOpen + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>' +
      '</button>' +
      '<div class="kiwl-chat-panel" role="dialog" aria-label="' + t.title + '">' +
        '<div class="kiwl-chat-header">' +
          '<div class="kiwl-chat-avatar">KIWL</div>' +
          '<div class="kiwl-chat-header-info"><h4>' + t.title + '</h4><p>' + t.subtitle + '</p></div>' +
          '<button type="button" class="kiwl-chat-close" aria-label="' + t.ariaClose + '">&times;</button>' +
        '</div>' +
        '<div class="kiwl-chat-messages"></div>' +
        '<div class="kiwl-chat-typing"><span></span><span></span><span></span></div>' +
        '<div class="kiwl-chat-actions">' +
          '<div class="kiwl-chat-quick-btns"></div>' +
          '<a class="kiwl-chat-wa-btn" href="' + waLink(t.waPrefill) + '" target="_blank" rel="noopener noreferrer">' + t.waBtn + '</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function init() {
    var lang = getLang();
    var t = I18N[lang];
    var root = createWidget(t);
    var toggle = root.querySelector('.kiwl-chat-toggle');
    var panel = root.querySelector('.kiwl-chat-panel');
    var closeBtn = root.querySelector('.kiwl-chat-close');
    var messages = root.querySelector('.kiwl-chat-messages');
    var typing = root.querySelector('.kiwl-chat-typing');
    var quickBtns = root.querySelector('.kiwl-chat-quick-btns');
    var waBtn = root.querySelector('.kiwl-chat-wa-btn');
    var started = false;

    function scrollBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addMsg(text, type) {
      var el = document.createElement('div');
      el.className = 'kiwl-chat-msg ' + type;
      el.textContent = text;
      messages.appendChild(el);
      scrollBottom();
    }

    function showTyping(show) {
      typing.classList.toggle('is-visible', show);
      if (show) scrollBottom();
    }

    function botReply(text, delay, callback) {
      showTyping(true);
      setTimeout(function () {
        showTyping(false);
        addMsg(text, 'bot');
        if (callback) callback();
      }, delay || 900);
    }

    function setQuickButtons(buttons) {
      quickBtns.innerHTML = '';
      buttons.forEach(function (btn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = btn.label;
        b.addEventListener('click', btn.action);
        quickBtns.appendChild(b);
      });
    }

    function showMenu() {
      waBtn.classList.remove('is-visible');
      setQuickButtons([
        { label: t.btnProducts, action: function () { onChoice(t.btnProducts, t.replyProducts); } },
        { label: t.btnApplications, action: function () { onChoice(t.btnApplications, t.replyApplications); } },
        { label: t.btnAbout, action: function () { onChoice(t.btnAbout, t.replyAbout); } },
        { label: t.btnSales, action: function () { onChoice(t.btnSales, t.replySales, true); } }
      ]);
    }

    function showWhatsAppCta() {
      botReply(t.waPrompt, 700, function () {
        waBtn.classList.add('is-visible');
        setQuickButtons([
          { label: t.btnBack, action: function () {
            addMsg(t.btnBack, 'user');
            showMenu();
          }}
        ]);
      });
    }

    function onChoice(userLabel, botText, directSales) {
      addMsg(userLabel, 'user');
      setQuickButtons([]);
      botReply(botText, directSales ? 600 : 1000, function () {
        if (directSales) {
          showWhatsAppCta();
        } else {
          showWhatsAppCta();
        }
      });
    }

    function startConversation() {
      if (started) return;
      started = true;
      botReply(t.greeting, 500, function () {
        botReply(t.intro, 1100, function () {
          botReply(t.menuPrompt, 800, showMenu);
        });
      });
    }

    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) startConversation();
    });

    closeBtn.addEventListener('click', function () {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
