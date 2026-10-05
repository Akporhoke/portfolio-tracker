/* ============================================
   GAZE LEARN — CONTENT (data only)

   No screens or logic live here. To add a track or a
   lesson, add an entry below.

   Lesson fields
     status      'ready' (published) or 'soon' (listed only)
     sections    one screen each in the reader:
                 title, body[] (paragraphs), bullets[],
                 example {label, text}, tryIt {target, label, prefill}
                 Use **double stars** for bold.
     attribution  credit line for openly licensed material, shown on the
                 last section: {name, by, license, url}
     sources     free further reading links (shown on the last section)
     check       the knowledge check:
                   questions  the full question bank (15 per lesson)
                   perSession how many are asked each attempt (5)
                   passMark   how many must be right to pass (4)
                 Each attempt draws a fresh set, avoiding questions the
                 learner has already seen, and shuffles the answers.

   Track theme (colours are set in learn.js):
     teal, blue, green, mauve, amber, indigo
   ============================================ */

window.GAZE_LEARN = {
    "version": 2,
    "tracks": [
        {
            "id": "foundations",
            "title": "Foundations",
            "summary": "What stocks are and how markets work.",
            "level": "Beginner",
            "theme": "teal",
            "icon": "fa-seedling",
            "lessons": [
                {
                    "id": "what-is-a-stock",
                    "title": "What is a stock?",
                    "minutes": 4,
                    "status": "ready",
                    "sections": [
                        {
                            "title": "A small piece of a company",
                            "body": [
                                "A company needs money to grow. One way to get it is to sell small pieces of itself to the public. Each small piece is called a **share**. All the shares together are the company’s **stock**.",
                                "When you buy a share, you become a part-owner of the company. People call this a **shareholder**."
                            ],
                            "example": {
                                "label": "Imagine this",
                                "text": "A bakery is split into 10,000,000 shares. If you own 1,000 shares, you own 0.01% of the bakery. Small, but it is really yours."
                            }
                        },
                        {
                            "title": "Why do companies sell shares?",
                            "body": [
                                "Selling shares lets a company raise money to build, hire and grow. Unlike a loan, the company does not have to pay this money back on a fixed date.",
                                "In return, investors get a chance to share in the company’s success."
                            ],
                            "bullets": [
                                "Shares are bought and sold on a **stock exchange**.",
                                "In Nigeria, the main exchange is the **Nigerian Exchange (NGX)**.",
                                "In the US, the big ones are the **NYSE** and **Nasdaq**."
                            ],
                            "tryIt": {
                                "target": "explorer",
                                "label": "Browse NGX stocks in Explorer",
                                "prefill": {
                                    "market": "NGX"
                                }
                            }
                        },
                        {
                            "title": "How can shareholders make money?",
                            "body": [
                                "There are two main ways."
                            ],
                            "bullets": [
                                "**A higher share price.** You buy at one price and later sell for more.",
                                "**Dividends.** Some companies share part of their profit with shareholders. Not every company pays them."
                            ],
                            "example": {
                                "label": "Example",
                                "text": "You buy 50 shares at ₦200 each. That is ₦10,000. The price rises to ₦240. Your shares are now worth ₦12,000, a gain of ₦2,000 or 20%. Fees and taxes can reduce this."
                            },
                            "tryIt": {
                                "target": "calculator",
                                "label": "Try this example in the Calculator",
                                "prefill": {
                                    "market": "NGX",
                                    "shares": 50,
                                    "buy": 200,
                                    "sell": 240,
                                    "fee": 0
                                }
                            }
                        },
                        {
                            "title": "Prices go up and down",
                            "body": [
                                "A share price moves when people buy and sell. More buyers than sellers pushes the price up. More sellers than buyers pushes it down. Company news, profits and the wider economy all play a part.",
                                "This means stocks carry **risk**. A price can fall, and if a company fails, you can lose some or all of what you put in.",
                                "Many investors only use money they will not need for a long time, not rent or school fees."
                            ]
                        },
                        {
                            "title": "Quick recap",
                            "body": [
                                "You will also see two more words a lot."
                            ],
                            "bullets": [
                                "**Share** is one unit of ownership. **Stock** is ownership in general. People often use them to mean the same thing.",
                                "A **ticker** is a short code for a stock. AAPL is Apple in the US. GTCO is a large Nigerian financial group on the NGX.",
                                "You own a part of the company, you can earn from price growth or dividends, and prices can fall as well as rise."
                            ]
                        }
                    ],
                    "attribution": {
                        "name": "Principles of Finance",
                        "by": "OpenStax, Rice University",
                        "license": "CC BY 4.0",
                        "url": "https://openstax.org/details/books/principles-finance"
                    },
                    "sources": [
                        {
                            "label": "Investor.gov: Stocks (US SEC)",
                            "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/stocks"
                        },
                        {
                            "label": "OpenStax: Principles of Finance (free)",
                            "url": "https://openstax.org/details/books/principles-finance"
                        }
                    ],
                    "check": {
                        "perSession": 5,
                        "passMark": 4,
                        "questions": [
                            {
                                "id": "wsk-1",
                                "q": "What do you own when you buy a share of a company?",
                                "options": [
                                    "A job at the company",
                                    "A loan you gave the company",
                                    "A small part of the company",
                                    "A product the company makes"
                                ],
                                "answer": 2,
                                "explain": "A share is a small piece of ownership. That makes you a shareholder."
                            },
                            {
                                "id": "wsk-2",
                                "q": "A company has 1,000,000 shares and you own 10,000. What part of the company do you own?",
                                "options": [
                                    "1%",
                                    "100%",
                                    "10%",
                                    "0.1%"
                                ],
                                "answer": 0,
                                "explain": "10,000 divided by 1,000,000 is 0.01, which is 1%."
                            },
                            {
                                "id": "wsk-3",
                                "q": "Which of these is a way a shareholder can make money?",
                                "options": [
                                    "Only from fees paid by the exchange",
                                    "Only when the company repays a loan",
                                    "A higher share price, or dividends",
                                    "A guaranteed monthly payment"
                                ],
                                "answer": 2,
                                "explain": "Shareholders can gain if the price rises, or if the company pays dividends. Nothing is guaranteed."
                            },
                            {
                                "id": "wsk-4",
                                "q": "What is true about stock prices?",
                                "options": [
                                    "They rise and fall, so you can lose money",
                                    "They never fall for big companies",
                                    "The government fixes them every day",
                                    "They only change once a year"
                                ],
                                "answer": 0,
                                "explain": "Prices move all the time as people buy and sell, and they can fall as well as rise."
                            },
                            {
                                "id": "wsk-5",
                                "q": "What is a stock exchange?",
                                "options": [
                                    "A company that prints money",
                                    "A marketplace where buyers and sellers trade shares",
                                    "A government office that sets share prices",
                                    "A bank that lends to investors"
                                ],
                                "answer": 1,
                                "explain": "An exchange is a marketplace with rules. It brings buyers and sellers together."
                            },
                            {
                                "id": "wsk-6",
                                "q": "What do we call a person who owns shares in a company?",
                                "options": [
                                    "A supplier",
                                    "A regulator",
                                    "An auditor",
                                    "A shareholder"
                                ],
                                "answer": 3,
                                "explain": "Owning shares makes you a part-owner, or shareholder."
                            },
                            {
                                "id": "wsk-7",
                                "q": "Which is the main exchange for Nigerian companies?",
                                "options": [
                                    "The Nigerian Exchange (NGX)",
                                    "Nasdaq",
                                    "The Central Bank of Nigeria",
                                    "The NYSE"
                                ],
                                "answer": 0,
                                "explain": "The NGX is Nigeria’s main stock exchange. The NYSE and Nasdaq are in the US."
                            },
                            {
                                "id": "wsk-8",
                                "q": "What is a dividend?",
                                "options": [
                                    "A share of a company’s profit paid to shareholders",
                                    "A fee you pay to buy a share",
                                    "The price of one share",
                                    "A loan from the company"
                                ],
                                "answer": 0,
                                "explain": "A dividend is part of a company’s profit that it chooses to pay out to shareholders."
                            },
                            {
                                "id": "wsk-9",
                                "q": "Do all companies pay dividends?",
                                "options": [
                                    "Only companies that are losing money pay",
                                    "Yes, every company must pay each year",
                                    "Only companies on the NGX pay",
                                    "No, some companies pay none"
                                ],
                                "answer": 3,
                                "explain": "Dividends are a choice. Many companies keep their profit to grow the business instead."
                            },
                            {
                                "id": "wsk-10",
                                "q": "You buy 20 shares at ₦100 each and the price rises to ₦125. What is your gain, ignoring fees?",
                                "options": [
                                    "₦500",
                                    "₦25",
                                    "₦2,500",
                                    "₦2,000"
                                ],
                                "answer": 0,
                                "explain": "Each share gained ₦25. With 20 shares, 20 × ₦25 = ₦500."
                            },
                            {
                                "id": "wsk-11",
                                "q": "You buy 10 shares at ₦400 each and the price rises to ₦500. What is your percentage gain?",
                                "options": [
                                    "100%",
                                    "25%",
                                    "20%",
                                    "10%"
                                ],
                                "answer": 1,
                                "explain": "Each share gained ₦100. ₦100 divided by ₦400 is 0.25, which is 25%."
                            },
                            {
                                "id": "wsk-12",
                                "q": "Which statement about risk is true?",
                                "options": [
                                    "Stocks always recover within a year",
                                    "Stocks are guaranteed by the exchange",
                                    "Big companies can never lose value",
                                    "You can lose some or all of the money you invest in stocks"
                                ],
                                "answer": 3,
                                "explain": "Stocks carry risk. Prices can fall and a failing company can lose its value."
                            },
                            {
                                "id": "wsk-13",
                                "q": "What is a ticker?",
                                "options": [
                                    "A short code that identifies a stock",
                                    "A company’s yearly profit",
                                    "The fee a broker charges",
                                    "A document that proves you own shares"
                                ],
                                "answer": 0,
                                "explain": "A ticker is a short code, like AAPL or GTCO, used to find a stock."
                            },
                            {
                                "id": "wsk-14",
                                "q": "Why do companies sell shares to the public?",
                                "options": [
                                    "Because the law forbids private companies",
                                    "To lower their share price",
                                    "To raise money to grow the business",
                                    "To avoid ever paying anyone"
                                ],
                                "answer": 2,
                                "explain": "Selling shares brings in money for building, hiring and growing."
                            },
                            {
                                "id": "wsk-15",
                                "q": "Which is a common rule of thumb for the money you put into stocks?",
                                "options": [
                                    "Use your rent money",
                                    "Put everything you own into one stock",
                                    "Borrow money so you can buy more",
                                    "Only invest money you will not need soon"
                                ],
                                "answer": 3,
                                "explain": "Prices can fall, so many investors only use money they can leave alone for a long time."
                            }
                        ]
                    }
                },
                {
                    "id": "how-the-market-works",
                    "title": "How the stock market works",
                    "minutes": 5,
                    "status": "ready",
                    "sections": [
                        {
                            "title": "A marketplace for shares",
                            "body": [
                                "A stock market is a place where people buy and sell shares of companies. The place itself is called an **exchange**.",
                                "When you buy a share, you usually buy it from another investor who wants to sell, not from the company. The exchange brings buyers and sellers together and runs fair rules."
                            ],
                            "bullets": [
                                "The first time a company sells shares to the public is called an **IPO** (initial public offering).",
                                "After that, shares trade between investors. This is the **secondary market**, and it is where most trading happens."
                            ],
                            "example": {
                                "label": "Imagine this",
                                "text": "Ada owns 100 shares and wants cash. Bola wants to own 100 shares. The exchange matches them and the shares change hands. The company is not part of that trade."
                            }
                        },
                        {
                            "title": "Brokers: your way in",
                            "body": [
                                "You cannot trade on an exchange directly. You place orders through a **broker**, which is a licensed firm or app that buys and sells for you.",
                                "Check that a broker is properly licensed for the market you want. In Nigeria, brokers are registered with the SEC and are members of the NGX."
                            ],
                            "bullets": [
                                "Your shares are recorded electronically, not on paper.",
                                "In Nigeria, that record is kept in a **CSCS account**. Your broker usually sets it up for you.",
                                "Brokers charge fees, so compare costs before you choose."
                            ]
                        },
                        {
                            "title": "Bid, ask and the spread",
                            "body": [
                                "At any moment, buyers and sellers want different prices. The highest price a buyer will pay is the **bid**. The lowest price a seller will accept is the **ask**. The gap between them is the **spread**.",
                                "A small spread usually means many people trade the stock. A wide spread can make trading more costly."
                            ],
                            "example": {
                                "label": "Example",
                                "text": "A stock has a bid of ₦49.90 and an ask of ₦50.10. If you buy right away, you pay ₦50.10. If you sell right away, you get ₦49.90. The spread is ₦0.20."
                            }
                        },
                        {
                            "title": "Market orders and limit orders",
                            "body": [
                                "When you place an order, you choose how it trades."
                            ],
                            "bullets": [
                                "A **market order** trades straight away at the best price available. It is fast, but the price can differ from what you saw.",
                                "A **limit order** sets your own price. It only trades at that price or better, so it may never trade at all."
                            ],
                            "example": {
                                "label": "Example",
                                "text": "A stock trades at ₦60 and you only want to pay ₦54. A limit order at ₦54 waits. It goes through only if the price falls to ₦54."
                            }
                        },
                        {
                            "title": "Who sets the price?",
                            "body": [
                                "No one sets the price directly. It moves as buyers and sellers place orders. When more people want to buy than sell, the price tends to rise. When more want to sell, it tends to fall.",
                                "After a trade, it still needs to be **settled**. The money and the shares change hands and your broker records the shares in your account. This usually takes a few business days, and the exact time depends on the market."
                            ],
                            "bullets": [
                                "Exchanges match buyers and sellers.",
                                "Brokers place your orders.",
                                "Market orders are fast. Limit orders let you control the price."
                            ]
                        }
                    ],
                    "attribution": {
                        "name": "Principles of Finance",
                        "by": "OpenStax, Rice University",
                        "license": "CC BY 4.0",
                        "url": "https://openstax.org/details/books/principles-finance"
                    },
                    "sources": [
                        {
                            "label": "Investor.gov (US SEC)",
                            "url": "https://www.investor.gov/"
                        },
                        {
                            "label": "OpenStax: Principles of Finance (free)",
                            "url": "https://openstax.org/details/books/principles-finance"
                        }
                    ],
                    "check": {
                        "perSession": 5,
                        "passMark": 4,
                        "questions": [
                            {
                                "id": "hmw-1",
                                "q": "When you trade on an exchange, who do you usually buy shares from?",
                                "options": [
                                    "The exchange’s own stock",
                                    "Another investor who wants to sell",
                                    "The government",
                                    "Directly from the company"
                                ],
                                "answer": 1,
                                "explain": "Most trades are between investors. The exchange matches them."
                            },
                            {
                                "id": "hmw-2",
                                "q": "What does a broker do?",
                                "options": [
                                    "Guarantees you a profit",
                                    "Sets the price of every share",
                                    "Places buy and sell orders for you",
                                    "Prints new shares"
                                ],
                                "answer": 2,
                                "explain": "A broker is a licensed firm or app that trades on your behalf."
                            },
                            {
                                "id": "hmw-3",
                                "q": "What is an IPO?",
                                "options": [
                                    "A type of broker fee",
                                    "A tax on share profits",
                                    "The first time a company sells shares to the public",
                                    "A daily price update"
                                ],
                                "answer": 2,
                                "explain": "IPO stands for initial public offering."
                            },
                            {
                                "id": "hmw-4",
                                "q": "Most trading happens in which market?",
                                "options": [
                                    "The secondary market",
                                    "The primary market",
                                    "The bond market",
                                    "The black market"
                                ],
                                "answer": 0,
                                "explain": "After the IPO, shares trade between investors in the secondary market."
                            },
                            {
                                "id": "hmw-5",
                                "q": "In Nigeria, where are your shares recorded electronically?",
                                "options": [
                                    "Only on paper certificates",
                                    "In your bank account",
                                    "On the NGX trading floor",
                                    "In a CSCS account"
                                ],
                                "answer": 3,
                                "explain": "The CSCS holds the electronic record of shares. Your broker usually sets up the account."
                            },
                            {
                                "id": "hmw-6",
                                "q": "What should you check before using a broker?",
                                "options": [
                                    "That it is brand new",
                                    "That it is properly licensed",
                                    "That it promises high returns",
                                    "That it has the most adverts"
                                ],
                                "answer": 1,
                                "explain": "A licensed broker is regulated. Be careful with anyone promising big returns."
                            },
                            {
                                "id": "hmw-7",
                                "q": "What is the “bid” price?",
                                "options": [
                                    "The lowest price a seller will accept",
                                    "The broker’s fee",
                                    "The price a company first sold at",
                                    "The highest price a buyer will pay"
                                ],
                                "answer": 3,
                                "explain": "The bid is what buyers are offering. The ask is what sellers want."
                            },
                            {
                                "id": "hmw-8",
                                "q": "What is the “ask” price?",
                                "options": [
                                    "The closing price",
                                    "The lowest price a seller will accept",
                                    "The highest price a buyer will pay",
                                    "The dividend"
                                ],
                                "answer": 1,
                                "explain": "The ask is the lowest price a seller will take right now."
                            },
                            {
                                "id": "hmw-9",
                                "q": "A stock has a bid of ₦49.90 and an ask of ₦50.10. What is the spread?",
                                "options": [
                                    "₦50.00",
                                    "₦0.10",
                                    "₦0.20",
                                    "₦100.00"
                                ],
                                "answer": 2,
                                "explain": "₦50.10 minus ₦49.90 is ₦0.20."
                            },
                            {
                                "id": "hmw-10",
                                "q": "What does a market order do?",
                                "options": [
                                    "Cancels itself after a year",
                                    "Waits until your chosen price",
                                    "Guarantees the lowest price",
                                    "Trades straight away at the best available price"
                                ],
                                "answer": 3,
                                "explain": "A market order is fast, but you do not control the exact price."
                            },
                            {
                                "id": "hmw-11",
                                "q": "What does a limit order do?",
                                "options": [
                                    "Guarantees the order will trade",
                                    "Trades only at your price or better",
                                    "Always trades immediately",
                                    "Sets the price for everyone"
                                ],
                                "answer": 1,
                                "explain": "A limit order protects your price, but it may never trade."
                            },
                            {
                                "id": "hmw-12",
                                "q": "You place a limit order to buy at ₦54, but the price stays at ₦60. What happens?",
                                "options": [
                                    "The broker pays the difference",
                                    "It trades at ₦60 anyway",
                                    "The order waits and may never trade",
                                    "It trades at ₦54 immediately"
                                ],
                                "answer": 2,
                                "explain": "A limit order only trades at your price or better."
                            },
                            {
                                "id": "hmw-13",
                                "q": "What usually pushes a share price up?",
                                "options": [
                                    "Fewer people watching the stock",
                                    "More sellers than buyers",
                                    "A fixed daily price from the exchange",
                                    "More buyers than sellers"
                                ],
                                "answer": 3,
                                "explain": "Prices move with supply and demand. More buyers tends to lift the price."
                            },
                            {
                                "id": "hmw-14",
                                "q": "What is “settlement”?",
                                "options": [
                                    "A fee paid to the broker",
                                    "The price a stock opens at",
                                    "A company paying a dividend",
                                    "Money and shares are exchanged and recorded after a trade"
                                ],
                                "answer": 3,
                                "explain": "Settlement finishes the trade. It usually takes a few business days."
                            },
                            {
                                "id": "hmw-15",
                                "q": "Which statement about the spread is true?",
                                "options": [
                                    "The spread is the same as a dividend",
                                    "A small spread usually means the stock trades often",
                                    "A wide spread always means a good price",
                                    "The spread is a tax paid to the government"
                                ],
                                "answer": 1,
                                "explain": "Heavily traded stocks usually have small spreads. Wide spreads can cost you more."
                            }
                        ]
                    }
                },
                {
                    "id": "ngx-and-us-markets",
                    "title": "The NGX and US markets",
                    "minutes": 5,
                    "status": "ready",
                    "sections": [
                        {
                            "title": "The Nigerian Exchange (NGX)",
                            "body": [
                                "The **Nigerian Exchange (NGX)** is Nigeria’s main stock market. It used to be called the Nigerian Stock Exchange. Listed companies include banks, telecoms, cement makers and consumer goods firms.",
                                "The Securities and Exchange Commission (SEC) of Nigeria regulates the market."
                            ],
                            "bullets": [
                                "Shares are priced in naira (₦).",
                                "You trade through a licensed broker or app."
                            ],
                            "tryIt": {
                                "target": "explorer",
                                "label": "Browse NGX stocks in Explorer",
                                "prefill": {
                                    "market": "NGX"
                                }
                            }
                        },
                        {
                            "title": "The US markets",
                            "body": [
                                "The two biggest US exchanges are the **NYSE** and **Nasdaq**. Together they list thousands of companies, from household names like Apple and Microsoft to small start-ups.",
                                "US shares are priced in US dollars ($)."
                            ],
                            "bullets": [
                                "An **index** tracks a group of stocks to show how a market is doing.",
                                "The **S&P 500** follows 500 large US companies and is often used to describe how the US market is doing."
                            ],
                            "tryIt": {
                                "target": "explorer",
                                "label": "Browse US stocks in Explorer",
                                "prefill": {
                                    "market": "US"
                                }
                            }
                        },
                        {
                            "title": "Why currency matters",
                            "body": [
                                "US shares are priced in dollars, but your money may be in naira. When the exchange rate changes, your result in naira changes too, even if the share price does not move.",
                                "These numbers are made up to show the idea. The exchange rate can also move against you.",
                                "In Gaze, you can show your total portfolio in ₦ or $ from Settings."
                            ],
                            "example": {
                                "label": "Imagine this",
                                "text": "You buy 1 share at $100 when $1 = ₦1,500. That costs ₦150,000. Later the share is $110 and $1 = ₦1,650. Now it is worth ₦181,500, a gain of 21% in naira. The share itself rose only 10%."
                            }
                        },
                        {
                            "title": "Key differences",
                            "body": [
                                "Always check that your broker or app is licensed for the market you want to trade."
                            ],
                            "bullets": [
                                "**Size.** The US markets are much bigger, with far more companies and daily trading.",
                                "**Time zones.** The two markets are open at different hours.",
                                "**Rules and costs.** Fees, taxes and how you buy depend on the market and the platform.",
                                "**Liquidity** is how easily a stock can be bought or sold. Smaller, less active stocks can be harder to trade quickly."
                            ]
                        },
                        {
                            "title": "Quick recap",
                            "body": [
                                "Keep these in mind when you add stocks."
                            ],
                            "bullets": [
                                "NGX stocks are priced in naira. US stocks are priced in dollars.",
                                "Exchange rates can change your result in naira.",
                                "Check which market and currency each stock uses."
                            ]
                        }
                    ],
                    "attribution": {
                        "name": "Principles of Finance",
                        "by": "OpenStax, Rice University",
                        "license": "CC BY 4.0",
                        "url": "https://openstax.org/details/books/principles-finance"
                    },
                    "sources": [
                        {
                            "label": "Investor.gov (US SEC)",
                            "url": "https://www.investor.gov/"
                        },
                        {
                            "label": "OpenStax: Principles of Finance (free)",
                            "url": "https://openstax.org/details/books/principles-finance"
                        }
                    ],
                    "check": {
                        "perSession": 5,
                        "passMark": 4,
                        "questions": [
                            {
                                "id": "nus-1",
                                "q": "What does NGX stand for?",
                                "options": [
                                    "Nigerian Government Exchange",
                                    "Nigerian Exchange",
                                    "National Growth Index",
                                    "New Global Exchange"
                                ],
                                "answer": 1,
                                "explain": "The NGX is the Nigerian Exchange, formerly the Nigerian Stock Exchange."
                            },
                            {
                                "id": "nus-2",
                                "q": "Which body regulates Nigeria’s capital market?",
                                "options": [
                                    "Nasdaq",
                                    "The SEC (Securities and Exchange Commission)",
                                    "The NYSE",
                                    "A broker"
                                ],
                                "answer": 1,
                                "explain": "The SEC of Nigeria is the market regulator."
                            },
                            {
                                "id": "nus-3",
                                "q": "In what currency are NGX shares priced?",
                                "options": [
                                    "US dollars ($)",
                                    "Pounds (£)",
                                    "Euros (€)",
                                    "Naira (₦)"
                                ],
                                "answer": 3,
                                "explain": "NGX shares are priced in naira."
                            },
                            {
                                "id": "nus-4",
                                "q": "Which two exchanges are the biggest in the US?",
                                "options": [
                                    "The NGX and the NYSE",
                                    "The SEC and the Dow",
                                    "The NYSE and Nasdaq",
                                    "Nasdaq and the CSCS"
                                ],
                                "answer": 2,
                                "explain": "The NYSE and Nasdaq are the two biggest US exchanges."
                            },
                            {
                                "id": "nus-5",
                                "q": "US shares are normally priced in…",
                                "options": [
                                    "Gold",
                                    "Euros",
                                    "Naira",
                                    "US dollars"
                                ],
                                "answer": 3,
                                "explain": "US shares are priced in dollars."
                            },
                            {
                                "id": "nus-6",
                                "q": "What is the S&P 500?",
                                "options": [
                                    "A US government tax",
                                    "A broker with 500 offices",
                                    "A single company with 500 shares",
                                    "An index that follows 500 large US companies"
                                ],
                                "answer": 3,
                                "explain": "The S&P 500 tracks 500 large US companies."
                            },
                            {
                                "id": "nus-7",
                                "q": "What is a stock market index?",
                                "options": [
                                    "A list of broker fees",
                                    "The price of one share",
                                    "A measure that tracks a group of stocks",
                                    "A guarantee of profit"
                                ],
                                "answer": 2,
                                "explain": "An index shows how a group of stocks is doing overall."
                            },
                            {
                                "id": "nus-8",
                                "q": "A US share’s price does not change, but the dollar becomes worth more naira. What happens to its value in naira?",
                                "options": [
                                    "It goes down",
                                    "It becomes zero",
                                    "It goes up",
                                    "It stays the same"
                                ],
                                "answer": 2,
                                "explain": "The share is priced in dollars. When each dollar is worth more naira, the share is worth more naira."
                            },
                            {
                                "id": "nus-9",
                                "q": "You buy 1 share at $100 when $1 = ₦1,500. What does it cost in naira?",
                                "options": [
                                    "₦100,000",
                                    "₦1,500",
                                    "₦15,000",
                                    "₦150,000"
                                ],
                                "answer": 3,
                                "explain": "$100 × ₦1,500 = ₦150,000."
                            },
                            {
                                "id": "nus-10",
                                "q": "A US share rises 10%. Why might your gain in naira be bigger or smaller than 10%?",
                                "options": [
                                    "The exchange rate can change too",
                                    "The NGX adds a bonus",
                                    "Brokers change the share price",
                                    "Dividends are always paid"
                                ],
                                "answer": 0,
                                "explain": "Your naira result depends on the share price and on the exchange rate."
                            },
                            {
                                "id": "nus-11",
                                "q": "Which statement about the US and Nigerian markets is true?",
                                "options": [
                                    "They use the same currency",
                                    "The US markets are much larger",
                                    "The NGX is larger than the NYSE",
                                    "They are open at the same hours"
                                ],
                                "answer": 1,
                                "explain": "The US markets list far more companies and see much more trading."
                            },
                            {
                                "id": "nus-12",
                                "q": "What is “liquidity”?",
                                "options": [
                                    "How much profit a company makes",
                                    "The size of a company’s building",
                                    "A type of dividend",
                                    "How easily a stock can be bought or sold"
                                ],
                                "answer": 3,
                                "explain": "A liquid stock is easy to trade without moving the price much."
                            },
                            {
                                "id": "nus-13",
                                "q": "Why can a thinly traded stock be harder to sell?",
                                "options": [
                                    "Dividends are cancelled",
                                    "There may be few buyers at the price you want",
                                    "The exchange forbids selling",
                                    "Its ticker is hidden"
                                ],
                                "answer": 1,
                                "explain": "When few people trade a stock, finding a buyer at your price can take time."
                            },
                            {
                                "id": "nus-14",
                                "q": "Before trading on a market, what should you check?",
                                "options": [
                                    "That your friend owns it",
                                    "That your broker or app is licensed for that market",
                                    "That the stock is cheap",
                                    "That it has a short ticker"
                                ],
                                "answer": 1,
                                "explain": "A licensed broker is regulated for the market it serves."
                            },
                            {
                                "id": "nus-15",
                                "q": "Gaze shows your total in naira or dollars. Why is that useful if you hold both NGX and US shares?",
                                "options": [
                                    "You can see your whole total in one currency",
                                    "It removes exchange-rate risk",
                                    "It changes the share prices",
                                    "It pays dividends"
                                ],
                                "answer": 0,
                                "explain": "One currency makes it easier to compare and add up different holdings."
                            }
                        ]
                    }
                },
                {
                    "id": "reading-a-stock-price",
                    "title": "Reading a stock price",
                    "minutes": 4,
                    "status": "ready",
                    "sections": [
                        {
                            "title": "What a quote shows",
                            "body": [
                                "A **quote** is a snapshot of how a stock is trading. You will usually see:"
                            ],
                            "bullets": [
                                "The **ticker**, a short code such as GTCO or AAPL.",
                                "The **last price**, the most recent price someone paid.",
                                "The **change**, how much the price moved, in money and in percent.",
                                "The **volume**, how many shares have traded."
                            ]
                        },
                        {
                            "title": "Change and percent change",
                            "body": [
                                "Change compares the price now with the **previous close**, which is the price at the end of the last trading day.",
                                "Percent change is easier to compare across stocks. A ₦2 rise is a big move for a ₦20 share (10%) but a tiny one for a ₦2,000 share (0.1%)."
                            ],
                            "example": {
                                "label": "Example",
                                "text": "The previous close was ₦50 and the price is now ₦52. The change is +₦2, which is +4% (2 divided by 50)."
                            },
                            "tryIt": {
                                "target": "calculator",
                                "label": "Check the percentage in the Calculator",
                                "prefill": {
                                    "market": "NGX",
                                    "shares": 1,
                                    "buy": 50,
                                    "sell": 52,
                                    "fee": 0
                                }
                            }
                        },
                        {
                            "title": "Volume",
                            "body": [
                                "Volume is the number of shares traded in a period, often a day. High volume means lots of activity. Low volume means few trades, which can make it harder to buy or sell at the price you want."
                            ],
                            "example": {
                                "label": "Think about it",
                                "text": "A big price jump on very few trades may not mean much. A jump on high volume shows that many investors took part."
                            }
                        },
                        {
                            "title": "Market cap",
                            "body": [
                                "Market capitalisation, or **market cap**, is the total value of all a company’s shares. Multiply the share price by the number of shares.",
                                "A low share price does not mean a small or cheap company. Compare market caps, not share prices."
                            ],
                            "example": {
                                "label": "Example",
                                "text": "A company has 1,000,000,000 shares priced at ₦20. Its market cap is ₦20 billion."
                            },
                            "tryIt": {
                                "target": "explorer",
                                "label": "See market caps in Explorer",
                                "prefill": {}
                            }
                        },
                        {
                            "title": "Highs, lows and the big picture",
                            "body": [
                                "Many quotes also show the **day’s high and low**, and the **52-week high and low**, which are the highest and lowest prices of the past year. They show how much a price has moved.",
                                "A price is a snapshot. It tells you what people paid, not whether a company is a good investment."
                            ],
                            "bullets": [
                                "Change is measured from the previous close.",
                                "Percent change makes stocks easier to compare.",
                                "Check volume and market cap before drawing conclusions."
                            ]
                        }
                    ],
                    "attribution": {
                        "name": "Principles of Finance",
                        "by": "OpenStax, Rice University",
                        "license": "CC BY 4.0",
                        "url": "https://openstax.org/details/books/principles-finance"
                    },
                    "sources": [
                        {
                            "label": "Investor.gov (US SEC)",
                            "url": "https://www.investor.gov/"
                        },
                        {
                            "label": "OpenStax: Principles of Finance (free)",
                            "url": "https://openstax.org/details/books/principles-finance"
                        }
                    ],
                    "check": {
                        "perSession": 5,
                        "passMark": 4,
                        "questions": [
                            {
                                "id": "rsp-1",
                                "q": "GTCO and AAPL are examples of what?",
                                "options": [
                                    "Dividends",
                                    "Brokers",
                                    "Indexes",
                                    "Tickers"
                                ],
                                "answer": 3,
                                "explain": "A ticker is a short code that identifies a stock."
                            },
                            {
                                "id": "rsp-2",
                                "q": "What does the “last price” show?",
                                "options": [
                                    "The most recent price at which the stock traded",
                                    "The highest price ever",
                                    "Next week’s price",
                                    "The price the company first sold shares at"
                                ],
                                "answer": 0,
                                "explain": "The last price is the latest price someone paid."
                            },
                            {
                                "id": "rsp-3",
                                "q": "What is the “previous close”?",
                                "options": [
                                    "The price at the end of the last trading day",
                                    "The price at tomorrow’s open",
                                    "The company’s profit",
                                    "The year’s lowest price"
                                ],
                                "answer": 0,
                                "explain": "Daily change is measured against the previous close."
                            },
                            {
                                "id": "rsp-4",
                                "q": "The previous close was ₦50 and the price is now ₦52. What is the change?",
                                "options": [
                                    "+₦52",
                                    "-₦2",
                                    "+₦4",
                                    "+₦2"
                                ],
                                "answer": 3,
                                "explain": "₦52 minus ₦50 is +₦2."
                            },
                            {
                                "id": "rsp-5",
                                "q": "With the same prices (₦50 to ₦52), what is the percent change?",
                                "options": [
                                    "+52%",
                                    "+2%",
                                    "+4%",
                                    "+5%"
                                ],
                                "answer": 2,
                                "explain": "₦2 divided by ₦50 is 0.04, which is 4%."
                            },
                            {
                                "id": "rsp-6",
                                "q": "Which is easier for comparing moves across different stocks?",
                                "options": [
                                    "Ticker length",
                                    "The exchange’s opening time",
                                    "Percent change",
                                    "Company name"
                                ],
                                "answer": 2,
                                "explain": "Percent change puts every stock on the same scale."
                            },
                            {
                                "id": "rsp-7",
                                "q": "A ₦2 rise is a bigger percent move for which share?",
                                "options": [
                                    "They are the same",
                                    "A ₦20 share",
                                    "Neither rose",
                                    "A ₦2,000 share"
                                ],
                                "answer": 1,
                                "explain": "₦2 is 10% of ₦20 but only 0.1% of ₦2,000."
                            },
                            {
                                "id": "rsp-8",
                                "q": "What is volume?",
                                "options": [
                                    "The broker’s fee",
                                    "The price of one share",
                                    "The company’s total value",
                                    "The number of shares traded"
                                ],
                                "answer": 3,
                                "explain": "Volume counts how many shares changed hands."
                            },
                            {
                                "id": "rsp-9",
                                "q": "Why can very low volume be a problem?",
                                "options": [
                                    "It means the company is large",
                                    "It guarantees a price rise",
                                    "It can be harder to buy or sell at your price",
                                    "It cancels dividends"
                                ],
                                "answer": 2,
                                "explain": "With few trades, there may not be a buyer or seller at your price."
                            },
                            {
                                "id": "rsp-10",
                                "q": "What is market cap?",
                                "options": [
                                    "A company’s yearly profit",
                                    "The most a share can rise",
                                    "The price of one share",
                                    "Share price multiplied by the number of shares"
                                ],
                                "answer": 3,
                                "explain": "Market cap is the total value of all a company’s shares."
                            },
                            {
                                "id": "rsp-11",
                                "q": "A company has 1,000,000,000 shares priced at ₦20. What is its market cap?",
                                "options": [
                                    "₦20 million",
                                    "₦2 billion",
                                    "₦200 million",
                                    "₦20 billion"
                                ],
                                "answer": 3,
                                "explain": "1,000,000,000 × ₦20 = ₦20,000,000,000, or ₦20 billion."
                            },
                            {
                                "id": "rsp-12",
                                "q": "Company A’s shares cost ₦5 and Company B’s cost ₦500. What can you say about their size?",
                                "options": [
                                    "They are equal",
                                    "You cannot tell without the market cap",
                                    "A is smaller",
                                    "B is larger"
                                ],
                                "answer": 1,
                                "explain": "Share price alone does not show size. You also need the number of shares."
                            },
                            {
                                "id": "rsp-13",
                                "q": "What is the 52-week high?",
                                "options": [
                                    "The highest price today",
                                    "The average price",
                                    "The price 52 weeks from now",
                                    "The highest price in the past year"
                                ],
                                "answer": 3,
                                "explain": "The 52-week high is the top price over the last year."
                            },
                            {
                                "id": "rsp-14",
                                "q": "What does a price tell you?",
                                "options": [
                                    "What people paid recently, not whether the stock is a good investment",
                                    "How much dividend you will get",
                                    "Whether the company is safe",
                                    "What the price will be tomorrow"
                                ],
                                "answer": 0,
                                "explain": "A price is a snapshot. It does not judge the company."
                            },
                            {
                                "id": "rsp-15",
                                "q": "A stock jumps 10% on very few trades. What is a sensible reaction?",
                                "options": [
                                    "Check the volume before drawing conclusions",
                                    "Assume it will keep rising",
                                    "Buy straight away",
                                    "Ignore the price completely"
                                ],
                                "answer": 0,
                                "explain": "A jump on low volume may mean little. Look at the bigger picture first."
                            }
                        ]
                    }
                }
            ]
        },
        {
            "id": "reading-the-market",
            "title": "Reading the Market",
            "summary": "Prices, charts, volume and market cap.",
            "level": "Beginner",
            "theme": "blue",
            "icon": "fa-chart-line",
            "lessons": []
        },
        {
            "id": "company-basics",
            "title": "Company Basics",
            "summary": "Earnings, P/E and dividends in plain English.",
            "level": "Intermediate",
            "theme": "green",
            "icon": "fa-building",
            "lessons": []
        },
        {
            "id": "risk-and-diversification",
            "title": "Risk and Diversification",
            "summary": "Protect your money and spread your bets.",
            "level": "Intermediate",
            "theme": "mauve",
            "icon": "fa-shield-halved",
            "lessons": []
        },
        {
            "id": "costs-and-taxes",
            "title": "Costs, Fees and Tax",
            "summary": "What investing really costs you.",
            "level": "Intermediate",
            "theme": "amber",
            "icon": "fa-receipt",
            "lessons": []
        },
        {
            "id": "investor-mindset",
            "title": "Investor Mindset",
            "summary": "Stay calm and avoid common mistakes.",
            "level": "All levels",
            "theme": "indigo",
            "icon": "fa-brain",
            "lessons": []
        }
    ]
};
