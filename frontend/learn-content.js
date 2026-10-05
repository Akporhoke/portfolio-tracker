/* ============================================
   GAZE LEARN — CONTENT (data only)

   No screens or logic live here. To add a track or
   a lesson, add an entry below. The reader screens
   (Phase 3) will add `sections` and a `check` quiz
   to each lesson.

   Lesson status:
     'ready' = published, can be opened and completed
     'soon'  = listed, but not written yet

   Track theme (colours are set in learn.js):
     teal, blue, green, mauve, amber, indigo
   ============================================ */

window.GAZE_LEARN = {

    version: 1,

    tracks: [

        {
            id: 'foundations',
            title: 'Foundations',
            summary: 'What stocks are and how markets work.',
            level: 'Beginner',
            theme: 'teal',
            icon: 'fa-seedling',
            lessons: [
                {
                    id: 'what-is-a-stock',
                    title: 'What is a stock?',
                    minutes: 4,
                    status: 'ready',

                    // Each section is one screen in the reader.
                    // body = paragraphs, bullets = optional list,
                    // example = optional highlighted card.
                    // Use **double stars** for bold.
                    sections: [

                        {
                            title: 'A small piece of a company',
                            body: [
                                'A company needs money to grow. One way to get it is to sell small pieces of itself to the public. Each small piece is called a **share**. All the shares together are the company’s **stock**.',
                                'When you buy a share, you become a part-owner of the company. People call this a **shareholder**.'
                            ],
                            example: {
                                label: 'Imagine this',
                                text: 'A bakery is split into 10,000,000 shares. If you own 1,000 shares, you own 0.01% of the bakery. Small, but it is really yours.'
                            }
                        },

                        {
                            title: 'Why do companies sell shares?',
                            body: [
                                'Selling shares lets a company raise money to build, hire and grow. Unlike a loan, the company does not have to pay this money back on a fixed date.',
                                'In return, investors get a chance to share in the company’s success.'
                            ],
                            bullets: [
                                'Shares are bought and sold on a **stock exchange**.',
                                'In Nigeria, the main exchange is the **Nigerian Exchange (NGX)**.',
                                'In the US, the big ones are the **NYSE** and **Nasdaq**.'
                            ],
                            // "Try it" button: opens one of your tools
                            tryIt: {
                                target: 'explorer',
                                label: 'Browse NGX stocks in Explorer',
                                prefill: { market: 'NGX' }
                            }
                        },

                        {
                            title: 'How can shareholders make money?',
                            body: [
                                'There are two main ways.'
                            ],
                            bullets: [
                                '**A higher share price.** You buy at one price and later sell for more.',
                                '**Dividends.** Some companies share part of their profit with shareholders. Not every company pays them.'
                            ],
                            example: {
                                label: 'Example',
                                text: 'You buy 50 shares at ₦200 each. That is ₦10,000. The price rises to ₦240. Your shares are now worth ₦12,000, a gain of ₦2,000 or 20%. Fees and taxes can reduce this.'
                            },
                            tryIt: {
                                target: 'calculator',
                                label: 'Try this example in the Calculator',
                                prefill: { market: 'NGX', shares: 50, buy: 200, sell: 240, fee: 0 }
                            }
                        },

                        {
                            title: 'Prices go up and down',
                            body: [
                                'A share price moves when people buy and sell. More buyers than sellers pushes the price up. More sellers than buyers pushes it down. Company news, profits and the wider economy all play a part.',
                                'This means stocks carry **risk**. A price can fall, and if a company fails, you can lose some or all of what you put in.',
                                'Many investors only use money they will not need for a long time, not rent or school fees.'
                            ]
                        },

                        {
                            title: 'Quick recap',
                            body: [
                                'You will also see two more words a lot.'
                            ],
                            bullets: [
                                '**Share** is one unit of ownership. **Stock** is ownership in general. People often use them to mean the same thing.',
                                'A **ticker** is a short code for a stock. AAPL is Apple in the US. GTCO is a large Nigerian financial group on the NGX.',
                                'You own a part of the company, you can earn from price growth or dividends, and prices can fall as well as rise.'
                            ]
                        }
                    ],

                    // Required knowledge check
                    check: {
                        passMark: 3,
                        questions: [

                            {
                                q: 'What do you own when you buy a share of a company?',
                                options: [
                                    'A loan you gave the company',
                                    'A small part of the company',
                                    'A product the company makes',
                                    'A job at the company'
                                ],
                                answer: 1,
                                explain: 'A share is a small piece of ownership. That makes you a shareholder.'
                            },

                            {
                                q: 'A company has 1,000,000 shares and you own 10,000. What part of the company do you own?',
                                options: ['0.1%', '10%', '1%', '100%'],
                                answer: 2,
                                explain: '10,000 divided by 1,000,000 is 0.01, which is 1%.'
                            },

                            {
                                q: 'Which of these is a way a shareholder can make money?',
                                options: [
                                    'Only when the company repays a loan',
                                    'Only from fees paid by the exchange',
                                    'A guaranteed monthly payment',
                                    'A higher share price, or dividends'
                                ],
                                answer: 3,
                                explain: 'Shareholders can gain if the price rises, or if the company pays dividends. Nothing is guaranteed.'
                            },

                            {
                                q: 'What is true about stock prices?',
                                options: [
                                    'They rise and fall, so you can lose money',
                                    'They never fall for big companies',
                                    'The government fixes them every day',
                                    'They only change once a year'
                                ],
                                answer: 0,
                                explain: 'Prices move all the time as people buy and sell, and they can fall as well as rise.'
                            }
                        ]
                    }
                },
                { id: 'how-the-market-works', title: 'How the stock market works', minutes: 5, status: 'soon' },
                { id: 'ngx-and-us-markets', title: 'The NGX and US markets', minutes: 5, status: 'soon' },
                { id: 'reading-a-stock-price', title: 'Reading a stock price', minutes: 4, status: 'soon' }
            ]
        },

        {
            id: 'reading-the-market',
            title: 'Reading the Market',
            summary: 'Prices, charts, volume and market cap.',
            level: 'Beginner',
            theme: 'blue',
            icon: 'fa-chart-line',
            lessons: []
        },

        {
            id: 'company-basics',
            title: 'Company Basics',
            summary: 'Earnings, P/E and dividends in plain English.',
            level: 'Intermediate',
            theme: 'green',
            icon: 'fa-building',
            lessons: []
        },

        {
            id: 'risk-and-diversification',
            title: 'Risk and Diversification',
            summary: 'Protect your money and spread your bets.',
            level: 'Intermediate',
            theme: 'mauve',
            icon: 'fa-shield-halved',
            lessons: []
        },

        {
            id: 'costs-and-taxes',
            title: 'Costs, Fees and Tax',
            summary: 'What investing really costs you.',
            level: 'Intermediate',
            theme: 'amber',
            icon: 'fa-receipt',
            lessons: []
        },

        {
            id: 'investor-mindset',
            title: 'Investor Mindset',
            summary: 'Stay calm and avoid common mistakes.',
            level: 'All levels',
            theme: 'indigo',
            icon: 'fa-brain',
            lessons: []
        }
    ]
};
