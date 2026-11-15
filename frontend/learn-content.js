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
/* ---------- 2) reading-a-stock-price ---------- */
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
        },
        {
            "title": "Common mistake",
            "body": [
                "Judging a stock by its price alone. A ₦5 share is not “cheap” and a ₦500 share is not “expensive”. Compare percent change, volume and market cap before you decide anything."
            ]
        },
        {
            "title": "What experts check",
            "bullets": [
                "Percent change against the previous close, not just the naira change.",
                "Volume compared with the stock’s normal activity.",
                "Market cap, to understand the size of the company.",
                "The 52-week range, to see where today’s price sits.",
                "The as-of time of the quote, so you know how fresh it is."
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
            { "id": "rsp-1", "q": "GTCO and AAPL are examples of what?", "options": ["Dividends", "Brokers", "Indexes", "Tickers"], "answer": 3, "explain": "A ticker is a short code that identifies a stock." },
            { "id": "rsp-2", "q": "What does the “last price” show?", "options": ["The most recent price at which the stock traded", "The highest price ever", "Next week’s price", "The price the company first sold shares at"], "answer": 0, "explain": "The last price is the latest price someone paid." },
            { "id": "rsp-3", "q": "What is the “previous close”?", "options": ["The price at the end of the last trading day", "The price at tomorrow’s open", "The company’s profit", "The year’s lowest price"], "answer": 0, "explain": "Daily change is measured against the previous close." },
            { "id": "rsp-4", "q": "The previous close was ₦50 and the price is now ₦52. What is the change?", "options": ["+₦52", "-₦2", "+₦4", "+₦2"], "answer": 3, "explain": "₦52 minus ₦50 is +₦2." },
            { "id": "rsp-5", "q": "With the same prices (₦50 to ₦52), what is the percent change?", "options": ["+52%", "+2%", "+4%", "+5%"], "answer": 2, "explain": "₦2 divided by ₦50 is 0.04, which is 4%." },
            { "id": "rsp-6", "q": "Which is easier for comparing moves across different stocks?", "options": ["Ticker length", "The exchange’s opening time", "Percent change", "Company name"], "answer": 2, "explain": "Percent change puts every stock on the same scale." },
            { "id": "rsp-7", "q": "A ₦2 rise is a bigger percent move for which share?", "options": ["They are the same", "A ₦20 share", "Neither rose", "A ₦2,000 share"], "answer": 1, "explain": "₦2 is 10% of ₦20 but only 0.1% of ₦2,000." },
            { "id": "rsp-8", "q": "What is volume?", "options": ["The broker’s fee", "The price of one share", "The company’s total value", "The number of shares traded"], "answer": 3, "explain": "Volume counts how many shares changed hands." },
            { "id": "rsp-9", "q": "Why can very low volume be a problem?", "options": ["It means the company is large", "It guarantees a price rise", "It can be harder to buy or sell at your price", "It cancels dividends"], "answer": 2, "explain": "With few trades, there may not be a buyer or seller at your price." },
            { "id": "rsp-10", "q": "What is market cap?", "options": ["A company’s yearly profit", "The most a share can rise", "The price of one share", "Share price multiplied by the number of shares"], "answer": 3, "explain": "Market cap is the total value of all a company’s shares." },
            { "id": "rsp-11", "q": "A company has 1,000,000,000 shares priced at ₦20. What is its market cap?", "options": ["₦20 million", "₦2 billion", "₦200 million", "₦20 billion"], "answer": 3, "explain": "1,000,000,000 × ₦20 = ₦20,000,000,000, or ₦20 billion." },
            { "id": "rsp-12", "q": "Company A’s shares cost ₦5 and Company B’s cost ₦500. What can you say about their size?", "options": ["They are equal", "You cannot tell without the market cap", "A is smaller", "B is larger"], "answer": 1, "explain": "Share price alone does not show size. You also need the number of shares." },
            { "id": "rsp-13", "q": "What is the 52-week high?", "options": ["The highest price today", "The average price", "The price 52 weeks from now", "The highest price in the past year"], "answer": 3, "explain": "The 52-week high is the top price over the last year." },
            { "id": "rsp-14", "q": "What does a price tell you?", "options": ["What people paid recently, not whether the stock is a good investment", "How much dividend you will get", "Whether the company is safe", "What the price will be tomorrow"], "answer": 0, "explain": "A price is a snapshot. It does not judge the company." },
            { "id": "rsp-15", "q": "A stock jumps 10% on very few trades. What is a sensible reaction?", "options": ["Check the volume before drawing conclusions", "Assume it will keep rising", "Buy straight away", "Ignore the price completely"], "answer": 0, "explain": "A jump on low volume may mean little. Look at the bigger picture first." }
        ]
    }
}

            ]
        },
        
/* ============================================
   GETTING STARTED: drop-in track
   Put this object right after "foundations" in the tracks array.
   4 lessons, 15 questions each (5 asked per try).
   NGX rules change often: re-check hours, settlement and price
   rules at ngxgroup.com before each release.
   ============================================ */
{
    "id": "getting-started",
    "title": "Getting Started",
    "summary": "Open accounts, place your first trade, know the rules.",
    "level": "Beginner",
    "theme": "teal",
    "icon": "fa-flag-checkered",
    "lessons": [
        {
            "id": "opening-your-accounts",
            "title": "Opening your investing accounts",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "What you need before you can trade",
                    "body": [
                        "You buy and sell shares through a **licensed stockbroker** or a licensed investment app. The broker opens a trading account for you and arranges a **CSCS account**, where your shares are recorded electronically.",
                        "Your CSCS account has its own number, often called a **CHN** (Clearing House Number). Keep it safe, because your broker will ask for it if you ever move your shares."
                    ]
                },
                {
                    "title": "Choosing a broker",
                    "body": [
                        "Do not choose on adverts or a friend’s word alone. Check that the firm is licensed, then compare what it costs and how well it works."
                    ],
                    "bullets": [
                        "**Licence:** confirm registration on the SEC Nigeria register and NGX membership, using their own websites.",
                        "**Costs:** commission, platform fees, withdrawal fees.",
                        "**Platform:** does it work reliably on your phone, and can you see your holdings and contract notes?",
                        "**Money handling:** how fast are deposits credited and withdrawals paid?",
                        "**Support:** can you reach a real person when something goes wrong?"
                    ]
                },
                {
                    "title": "Opening the account (KYC)",
                    "body": [
                        "Brokers must verify who you are. This is called **KYC**, short for “know your customer”. Requirements vary, but you will typically need a valid ID, your BVN or NIN, a passport photo, proof of address, bank details and a signature.",
                        "Do this only through the broker’s official website, app or office. Never send documents to a stranger on social media."
                    ]
                },
                {
                    "title": "Funding and withdrawing",
                    "body": [
                        "You fund your trading account by bank transfer. Pay only into an account in the **company’s registered name**, as shown on the broker’s official channels. When you sell, the money returns to your trading account, and you withdraw it to **your own** bank account.",
                        "Check how long withdrawals take and whether any fees apply, before you need the money."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Sending money to a personal account because an “agent” says it is faster. Legitimate brokers collect client money in company accounts. A personal account is a major warning sign."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is the broker on the regulator’s register?",
                        "Is the payment account in the company’s name?",
                        "Do I get contract notes and statements for every trade?",
                        "Do I know the withdrawal steps and timing?",
                        "Have I kept my login, PIN and one-time codes private?"
                    ]
                }
            ],
            "sources": [
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "oa-1", "q": "What do you need in order to buy NGX shares?", "options": ["A licensed stockbroker or licensed investment app", "A letter from the company", "A government permit for each trade", "A foreign bank account"], "answer": 0, "explain": "You trade through a licensed intermediary that places orders on your behalf." },
                    { "id": "oa-2", "q": "What does your CSCS account hold?", "options": ["Your cash savings", "Your loan balance", "The electronic record of the shares you own", "Your tax certificate"], "answer": 2, "explain": "The CSCS keeps the electronic record of share ownership." },
                    { "id": "oa-3", "q": "Where should you check that a broker is licensed?", "options": ["The broker’s own advert", "A link sent by the broker", "A friend’s message", "The regulator’s and exchange’s own websites"], "answer": 3, "explain": "Verify at the source, not through links or claims supplied by the firm." },
                    { "id": "oa-4", "q": "What does KYC mean?", "options": ["Know your customer: verifying who you are", "Keep your cash", "Key yield calculation", "Know your company’s profit"], "answer": 0, "explain": "Brokers must confirm the identity of every client." },
                    { "id": "oa-5", "q": "Which is typically needed to open a brokerage account?", "options": ["Nothing at all", "A valid ID and BVN or NIN, among other documents", "Your password to another app", "A guarantor’s card PIN"], "answer": 1, "explain": "Exact requirements vary, but identity and address documents are standard." },
                    { "id": "oa-6", "q": "An “agent” asks you to fund your account by sending money to his personal account. What should you do?", "options": ["Send it, it is faster", "Send half first", "Refuse and pay only into the broker’s official company account", "Ask him to keep it for you"], "answer": 2, "explain": "Client money should go to the firm’s registered account." },
                    { "id": "oa-7", "q": "Where should your sale proceeds be withdrawn to?", "options": ["Any account a caller gives you", "Your own bank account", "A friend’s account", "An agent’s wallet"], "answer": 1, "explain": "Withdraw only to an account in your own name." },
                    { "id": "oa-8", "q": "Which of these should you never share with anyone?", "options": ["The name of a stock", "Your broker’s name", "Your password and one-time codes", "A company’s ticker"], "answer": 2, "explain": "Passwords and codes give others control of your account." },
                    { "id": "oa-9", "q": "When comparing brokers, which cost view is best?", "options": ["Only the headline commission", "All fees: trading, platform and withdrawal", "Only the sign-up bonus", "Only the logo"], "answer": 1, "explain": "Total cost matters, not one number." },
                    { "id": "oa-10", "q": "What is a CHN?", "options": ["A broker’s phone number", "A type of dividend", "A number linked to your CSCS securities account", "A tax rate"], "answer": 2, "explain": "The Clearing House Number identifies your CSCS account." },
                    { "id": "oa-11", "q": "A broker promises guaranteed returns. What is the best reading?", "options": ["A strong sign it is trustworthy", "A normal feature of brokers", "A warning sign, because no one can guarantee investment returns", "A government guarantee"], "answer": 2, "explain": "Guaranteed returns are a classic scam signal." },
                    { "id": "oa-12", "q": "An app says it is “licensed”, but you cannot find it on the regulator’s register. What should you do?", "options": ["Trust the app", "Do not send money until you verify it", "Send a small amount to test", "Ask the app to confirm itself"], "answer": 1, "explain": "If you cannot verify the licence, treat the firm as unverified." },
                    { "id": "oa-13", "q": "Why keep contract notes and statements?", "options": ["They set the share price", "They avoid all taxes", "They are proof of your trades for disputes and tax", "They are required to log in"], "answer": 2, "explain": "They record dates, prices and costs of your trades." },
                    { "id": "oa-14", "q": "Why check withdrawal timing and fees before investing?", "options": ["So you know how quickly you can reach your money", "Because withdrawals are illegal", "To raise returns", "To avoid KYC"], "answer": 0, "explain": "Slow or costly withdrawals can be a nasty surprise." },
                    { "id": "oa-15", "q": "Which is the best way to choose a broker?", "options": ["Pick the one with the most adverts", "Pick the newest", "Pick whoever messages you first", "Verify the licence, then compare costs, reliability and support"], "answer": 3, "explain": "Safety first, then cost and service." }
                ]
            }
        },

        {
            "id": "placing-your-first-order",
            "title": "Placing your first order",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "From idea to order",
                    "body": [
                        "An order is an instruction to your broker. Before you send one, work through the same steps each time."
                    ],
                    "bullets": [
                        "Find the stock by its **ticker** and confirm the company name.",
                        "Check the price, the day’s range and the volume.",
                        "Decide how much money you will put in.",
                        "Choose the **order type**: market or limit.",
                        "Review everything, then submit."
                    ]
                },
                {
                    "title": "How many shares?",
                    "body": [
                        "Divide your budget by the price, then leave room for fees. Costs come out on top of the share price, so you can afford a little fewer shares than the simple division suggests."
                    ],
                    "example": {
                        "label": "Example (the fee is made up)",
                        "text": "Budget ₦100,000, price ₦50, total fees 1.5%. Each share costs about ₦50.75 with fees, so you can afford about 1,970 shares. Without fees you would have said 2,000."
                    },
                    "tryIt": {
                        "target": "calculator",
                        "label": "Try the numbers in the Calculator",
                        "prefill": { "market": "NGX", "shares": 1970, "buy": 50, "sell": 55, "fee": 1500 }
                    }
                },
                {
                    "title": "After you submit",
                    "body": [
                        "Your order shows a status. It may be **open** (waiting), **partially filled** (only some of your shares traded), **filled** (done), or **cancelled** or **expired** (it did not trade).",
                        "A limit order can sit unfilled if the price never reaches your level. You can cancel or change it while it is still open.",
                        "When an order fills, the broker issues a **contract note** showing the price, quantity and fees. Check it against what you ordered."
                    ]
                },
                {
                    "title": "Start small",
                    "body": [
                        "Your first trades are for learning the process, not for making money. Use an amount you would be fine with losing, and write down why you bought."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Typing the wrong quantity or price, for example an extra zero. Another is using a market order on a thinly traded stock and paying far more than expected."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Ticker and company name are right.",
                        "Buy or sell is the one I meant.",
                        "Quantity and price have the right number of zeros.",
                        "The order type fits how liquid the stock is.",
                        "Fees are included in what I can afford."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "fo-1", "q": "You have ₦100,000 and a share costs ₦50. Ignoring fees, how many shares can you buy?", "options": ["1,000", "5,000", "2,000", "200"], "answer": 2, "explain": "₦100,000 ÷ ₦50 = 2,000." },
                    { "id": "fo-2", "q": "You have ₦60,000 and a share costs ₦120. Ignoring fees, how many can you buy?", "options": ["500", "50", "720", "5,000"], "answer": 0, "explain": "₦60,000 ÷ ₦120 = 500." },
                    { "id": "fo-3", "q": "With fees of 1.5%, roughly how many ₦50 shares can ₦100,000 buy?", "options": ["2,030", "About 1,970", "1,500", "2,000 exactly"], "answer": 1, "explain": "Each share costs about ₦50.75 with fees, so about 1,970." },
                    { "id": "fo-4", "q": "What does a “partially filled” order mean?", "options": ["Only part of your quantity has traded so far", "The order was cancelled", "The broker kept part of your money", "The price is wrong"], "answer": 0, "explain": "Some, but not all, of the shares have been matched." },
                    { "id": "fo-5", "q": "You place a buy limit order at ₦48 while the price is ₦50. What happens?", "options": ["It buys at ₦50 at once", "It buys at ₦52", "The broker pays the gap", "It waits and trades only if the price reaches ₦48 or lower"], "answer": 3, "explain": "A limit order trades only at your price or better." },
                    { "id": "fo-6", "q": "What is a contract note?", "options": ["A loan agreement", "A document confirming the details of your trade", "A tax refund", "A company’s annual report"], "answer": 1, "explain": "It shows price, quantity and fees for the trade." },
                    { "id": "fo-7", "q": "Which habit best prevents typing mistakes in an order?", "options": ["Placing orders very fast", "Using only market orders", "Reviewing the confirmation screen before submitting", "Trading without checking the price"], "answer": 2, "explain": "A calm final check catches wrong tickers, quantities and prices." },
                    { "id": "fo-8", "q": "What is a risk of a market order on a thinly traded stock?", "options": ["It never trades", "You may pay a worse price than expected", "It doubles your shares", "It cancels dividends"], "answer": 1, "explain": "With few sellers, the best available price can be far from the last one." },
                    { "id": "fo-9", "q": "Why start with small trades?", "options": ["Small trades have no risk", "Brokers require it", "You learn the process while mistakes cost little", "Small trades pay higher dividends"], "answer": 2, "explain": "Early errors are cheaper when the amount is small." },
                    { "id": "fo-10", "q": "Which should you check on the review screen?", "options": ["Ticker, buy or sell, quantity, price and order type", "Only the company logo", "Only the broker’s name", "Nothing, the app is always right"], "answer": 0, "explain": "Each of these can be entered wrongly." },
                    { "id": "fo-11", "q": "Where are your shares recorded after a buy order is filled?", "options": ["On paper at the exchange", "In your bank statement", "In your CSCS account, through your broker", "In the company’s office"], "answer": 2, "explain": "Ownership is held electronically at the CSCS." },
                    { "id": "fo-12", "q": "You buy 200 shares at ₦50 and total fees are ₦150. What is your total cost?", "options": ["₦10,000", "₦10,150", "₦9,850", "₦150"], "answer": 1, "explain": "200 × ₦50 = ₦10,000, plus ₦150 = ₦10,150." },
                    { "id": "fo-13", "q": "You later sell the 200 shares at ₦55 with ₦160 fees. Your total cost was ₦10,150. What is your profit?", "options": ["₦1,000", "₦840", "₦690", "₦10,840"], "answer": 2, "explain": "Proceeds 200 × ₦55 = ₦11,000, minus ₦160 = ₦10,840. Minus ₦10,150 cost = ₦690." },
                    { "id": "fo-14", "q": "What does an “expired” order mean?", "options": ["It traded at the best price", "It did not trade before its time limit ended", "It was filled twice", "It was approved by the exchange"], "answer": 1, "explain": "An order that never matched ends when its time runs out." },
                    { "id": "fo-15", "q": "Why write down why you bought a stock?", "options": ["It raises the price", "It lowers the fee", "It is a legal requirement", "You can later review whether the reason still holds"], "answer": 3, "explain": "A record of your reasoning helps you learn and decide when to sell." }
                ]
            }
        },

/* ---------- 1) ngx-trading-rules ---------- */
{
    "id": "ngx-trading-rules",
    "title": "How trading works on the NGX",
    "minutes": 6,
    "status": "ready",
    "sections": [
        {
            "title": "The trading day",
            "body": [
                "The NGX trades on business days, not on weekends or public holidays. In 2026 the trading session was extended, with the market now closing at 4:00 p.m. instead of 2:30 p.m. Check the NGX website for the current schedule before you plan around it.",
                "You can buy as little as **one share**, because the lot size is one."
            ]
        },
        {
            "title": "The daily price limit",
            "body": [
                "A stock cannot rise or fall by more than **10%** from its previous close in one day. The top of the range is **limit up** and the bottom is **limit down**.",
                "The limit stops wild swings, but it does not guarantee you can sell. A stock stuck at limit down may have sellers and no buyers."
            ],
            "example": {
                "label": "Example",
                "text": "Previous close ₦100. Today the price can go no higher than ₦110 or lower than ₦90."
            }
        },
        {
            "title": "Settlement: T+1",
            "body": [
                "**Settlement** is when shares and money actually change hands. The Nigerian market moved from T+3 to T+2 in November 2025 and to **T+1** on 1 June 2026.",
                "T+1 means a trade settles **one business day** after it is made. Shares you buy on Monday are in your CSCS account on Tuesday, unless there is a holiday."
            ]
        },
        {
            "title": "Price steps and rule changes",
            "body": [
                "The exchange sets the **tick size**, the smallest step a price can move, and a **minimum quantity** that must trade in one transaction before the published price changes. Under the rule that applied for a long time, that quantity was 100,000 shares for every stock.",
                "In June 2026 the NGX published a tiered version: 10,000 shares for stocks at ₦1,000 and above, 50,000 for ₦500 to ₦999.99, and 100,000 for stocks below ₦500, with tick sizes of 10, 5 and 1 kobo. It was due to start on 17 August 2026, but the NGX postponed it. Whether it is live when you read this, check the NGX notices.",
                "Treat any number in an app or article as a snapshot, and confirm it with the exchange."
            ]
        },
        {
            "title": "Indices you will see",
            "bullets": [
                "**NGX All-Share Index (ASI):** follows all listed ordinary shares.",
                "**NGX 30:** follows 30 of the largest and most traded companies.",
                "**Sector indices:** such as banking, consumer goods, industrial goods and oil and gas."
            ]
        },
        {
            "title": "Common mistake",
            "body": [
                "Assuming a rule you learned last year still applies. Hours, settlement and price rules have all changed recently."
            ]
        },
        {
            "title": "What experts check",
            "bullets": [
                "Today’s trading hours and any market holiday.",
                "The day’s limit-up and limit-down prices.",
                "The settlement date of the trade, especially around holidays.",
                "Whether a stock actually trades often enough to exit.",
                "Recent NGX notices on rules."
            ]
        }
    ],
    "sources": [
        { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" },
        { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" }
    ],
    "check": {
        "perSession": 5,
        "passMark": 4,
        "questions": [
            { "id": "tr-1", "q": "What is the maximum a stock can move in one day on the NGX?", "options": ["10% up or down from the previous close", "1%", "50%", "There is no limit"], "answer": 0, "explain": "The NGX caps daily moves at 10% in either direction." },
            { "id": "tr-2", "q": "A stock’s previous close was ₦100. What is the highest price it can reach today?", "options": ["₦100", "₦105", "₦120", "₦110"], "answer": 3, "explain": "10% of ₦100 is ₦10, so ₦110." },
            { "id": "tr-3", "q": "A stock’s previous close was ₦250. What is the lowest it can fall to today?", "options": ["₦225", "₦200", "₦240", "₦150"], "answer": 0, "explain": "10% of ₦250 is ₦25, so ₦225." },
            { "id": "tr-4", "q": "What settlement cycle has the Nigerian market used since 1 June 2026?", "options": ["T+3", "T+1", "T+5", "Same hour"], "answer": 1, "explain": "The market moved to T+1 on 1 June 2026." },
            { "id": "tr-5", "q": "What does T+1 mean?", "options": ["A trade settles one hour later", "A trade never settles", "A trade settles one business day after it is made", "A trade costs 1% more"], "answer": 2, "explain": "T is the trade date, and settlement follows one business day later." },
            { "id": "tr-6", "q": "Before November 2025, what was the settlement cycle?", "options": ["T+1", "T+10", "T+0", "T+3"], "answer": 3, "explain": "The market moved from T+3 to T+2, then to T+1." },
            { "id": "tr-7", "q": "What is the smallest number of shares you can buy on the NGX?", "options": ["One share", "100 shares", "1,000 shares", "10,000 shares"], "answer": 0, "explain": "The lot size is one share." },
            { "id": "tr-8", "q": "What does the NGX All-Share Index follow?", "options": ["Only the ten largest banks", "Only US shares", "Only bonds", "All listed ordinary shares"], "answer": 3, "explain": "The ASI is the broad measure of the listed equity market." },
            { "id": "tr-9", "q": "What does the NGX 30 track?", "options": ["30 of the largest and most traded companies", "30 days of prices", "30 brokers", "30 types of order"], "answer": 0, "explain": "It follows a group of 30 large, actively traded stocks." },
            { "id": "tr-10", "q": "Why should you check NGX notices before relying on a rule?", "options": ["Rules never change", "Rules such as hours, settlement and price steps have changed recently", "Notices set share prices", "Brokers forbid trading otherwise"], "answer": 1, "explain": "Market rules are being reformed, so always confirm the current ones." },
            { "id": "tr-11", "q": "What is a tick size?", "options": ["A broker fee", "A type of dividend", "The smallest step a price can move", "The number of shares in a lot"], "answer": 2, "explain": "The tick size is the minimum price increment." },
            { "id": "tr-12", "q": "What does “limit up” mean?", "options": ["The price hit the maximum rise allowed for the day", "The order limit is high", "The company paid a dividend", "The market is closed"], "answer": 0, "explain": "It means the stock rose by the most the daily limit allows." },
            { "id": "tr-13", "q": "Why might a stock at limit down be hard to sell?", "options": ["Limit down forbids selling", "Brokers close early", "There may be sellers but no buyers", "Dividends are paid"], "answer": 2, "explain": "A big fall to the limit often means few or no buyers." },
            { "id": "tr-14", "q": "On which days does the NGX normally trade?", "options": ["Every day", "Only Fridays", "Only the first week of the month", "Business days, excluding public holidays"], "answer": 3, "explain": "The exchange closes on weekends and public holidays." },
            { "id": "tr-15", "q": "You buy on Monday and there are no holidays. Under T+1, when does the trade settle?", "options": ["Tuesday", "Monday evening only", "Friday", "The following Monday"], "answer": 0, "explain": "T+1 means one business day later." }
        ]
    }
},,

        {
            "id": "ipos-and-advanced-orders",
            "title": "IPOs, stop orders and short selling",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "IPOs and public offers",
                    "body": [
                        "An **IPO** is the first time a company sells shares to the public. You apply through a stockbroker or issuing house during an offer period, and you get an **allotment** afterwards.",
                        "If more people apply than there are shares, the offer is **oversubscribed** and allotments are often scaled back. The share may open on the exchange above or below the offer price, with no guarantee."
                    ]
                },
                {
                    "title": "Read the prospectus",
                    "body": [
                        "The **prospectus** is the official document for an offer. It describes the business, the risks, how the money will be used, who the directors and owners are, and the fees. Read it before you apply, not after."
                    ],
                    "bullets": [
                        "What will the company do with the money?",
                        "Are existing owners selling out?",
                        "How profitable and indebted is the business?",
                        "What price is being asked compared with similar listed firms?"
                    ]
                },
                {
                    "title": "Stop orders",
                    "body": [
                        "A **stop order** waits until the price reaches a trigger level, then becomes an order. A **sell stop** below the current price can limit a loss. A **stop-limit** order then sells only at your limit or better.",
                        "A stop is not a guarantee. If the price gaps past your level, the sale can happen lower. A stop-limit may not trade at all. Not every platform offers every order type, so ask your broker."
                    ]
                },
                {
                    "title": "Short selling",
                    "body": [
                        "**Short selling** means selling shares you have borrowed, hoping to buy them back cheaper. If the price falls you profit. If it rises you lose, and in theory there is no upper limit to that loss.",
                        "It is not a standard retail feature in every market, and it is risky for beginners. Know it exists, and know why it is dangerous, before you ever consider it."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating an IPO as free money because it is “new”. Many offers are fairly priced or expensive, and some fall after listing."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is the offer registered and the prospectus official?",
                        "Is the valuation sensible next to listed peers?",
                        "Who is selling, and why now?",
                        "Does my broker support this order type, and how does it behave in a fast market?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "ia-1", "q": "What is an IPO?", "options": ["A type of broker fee", "The first time a company sells shares to the public", "A tax on gains", "A daily price update"], "answer": 1, "explain": "IPO stands for initial public offering." },
                    { "id": "ia-2", "q": "What is a prospectus?", "options": ["A share certificate", "A price chart", "The official document describing an offer, its risks and use of funds", "A broker’s phone list"], "answer": 2, "explain": "It is the key document to read before applying." },
                    { "id": "ia-3", "q": "What does “oversubscribed” mean?", "options": ["More people applied than there are shares", "The offer was cancelled", "The price fell", "The offer was free"], "answer": 0, "explain": "Demand exceeded supply, so allotments may be scaled back." },
                    { "id": "ia-4", "q": "You apply for 10,000 shares in an oversubscribed offer. What might happen?", "options": ["You always get 10,000", "You may be allotted fewer shares", "You get double", "You pay nothing"], "answer": 1, "explain": "Allotment is often scaled back when demand is high." },
                    { "id": "ia-5", "q": "Is a share guaranteed to rise on its first day of trading?", "options": ["Yes", "Yes, for large offers", "Only on the NGX", "No"], "answer": 3, "explain": "Listing-day prices can be higher or lower than the offer price." },
                    { "id": "ia-6", "q": "What does a stop order do?", "options": ["Stops a stock from trading", "Becomes an order once the price reaches a trigger level", "Guarantees a profit", "Cancels dividends"], "answer": 1, "explain": "It waits for a trigger price, then becomes an order." },
                    { "id": "ia-7", "q": "A stock is at ₦100. You place a sell stop at ₦90. When does it activate?", "options": ["Immediately", "If the price rises to ₦110", "If the price falls to ₦90", "Never"], "answer": 2, "explain": "A sell stop triggers when the price falls to the trigger." },
                    { "id": "ia-8", "q": "What is the main limitation of a stop order?", "options": ["It cannot be cancelled", "The price can gap past it, so the sale may be worse than planned", "It raises fees", "It only works on Sundays"], "answer": 1, "explain": "In a fast fall, execution can be well below your trigger." },
                    { "id": "ia-9", "q": "What does a stop-limit order risk?", "options": ["Never trading if the price moves past the limit", "Selling at any price", "Doubling your loss", "Paying a dividend"], "answer": 0, "explain": "It sells only at your limit or better, so it may not fill." },
                    { "id": "ia-10", "q": "What is short selling?", "options": ["Buying shares for a short time", "Selling borrowed shares hoping to buy them back cheaper", "Selling after one day", "Buying small amounts"], "answer": 1, "explain": "The seller profits if the price falls." },
                    { "id": "ia-11", "q": "Why is short selling especially risky?", "options": ["Losses are limited to 10%", "The price cannot rise", "Dividends are doubled", "A price can rise without limit, so losses can be very large"], "answer": 3, "explain": "A share can keep rising, so the loss has no ceiling." },
                    { "id": "ia-12", "q": "What is the most you can lose by buying a share outright?", "options": ["Double your money", "Everything you invested", "Nothing", "Ten times your money"], "answer": 1, "explain": "A price cannot go below zero, so the loss is capped at your investment." },
                    { "id": "ia-13", "q": "Why ask your broker which order types are supported?", "options": ["All brokers offer identical features", "Orders are free", "Platforms differ in the orders they allow", "Order types set the price"], "answer": 2, "explain": "Not every platform offers every order type." },
                    { "id": "ia-14", "q": "Why read the prospectus before applying?", "options": ["It guarantees allotment", "To understand the business, risks and use of the money", "It lowers fees", "It sets the offer price"], "answer": 1, "explain": "You should know what you are buying before you commit." },
                    { "id": "ia-15", "q": "Which is a sign of an offer scam?", "options": ["A registered offer with a prospectus", "A licensed issuing house", "A guaranteed listing profit and pressure to pay now", "A clear fee list"], "answer": 2, "explain": "Guarantees and urgency are classic scam signals." }
                ]
            }
        }
    ]
},

        /* ============================================
   READING THE MARKET: drop-in track

   In learn-content.js, find the track with
   "id": "reading-the-market" and replace that whole
   { ... } object with the one below.
   Lessons: 3, each with 15 questions (5 asked per try).
   ============================================ */

{
    "id": "reading-the-market",
    "title": "Reading the Market",
    "summary": "Prices, charts, volume and market cap.",
    "level": "Beginner",
    "theme": "blue",
    "icon": "fa-chart-line",
    "lessons": [
        {
            "id": "reading-charts",
            "title": "Line charts and candlesticks",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "A chart is a price history",
                    "body": [
                        "A **chart** shows how a stock’s price has moved over time. Time runs along the bottom. Price is on the side.",
                        "The simplest version is a **line chart**. It joins the closing price of each period with a line, so you can see at a glance whether the price has climbed, fallen or stayed flat."
                    ],
                    "example": {
                        "label": "Imagine this",
                        "text": "A stock closes at ₦50 on Monday, ₦52 on Tuesday and ₦51 on Wednesday. A line chart joins those three points. The line rises, then dips slightly."
                    }
                },
                {
                    "title": "Candlesticks show more",
                    "body": [
                        "A line chart only shows the close. A **candlestick** shows four prices for each period, such as one day."
                    ],
                    "bullets": [
                        "**Open:** the first price of the period.",
                        "**High:** the highest price reached.",
                        "**Low:** the lowest price reached.",
                        "**Close:** the last price of the period."
                    ]
                },
                {
                    "title": "Body and wicks",
                    "body": [
                        "The thick part of a candle is the **body**. It runs from the open to the close. The thin lines above and below are the **wicks**. They reach up to the high and down to the low.",
                        "If the price closed higher than it opened, it is an **up candle**. If it closed lower, it is a **down candle**. Many apps use green for up and red for down, but colours can differ, so check the key."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A stock opens at ₦50, reaches a high of ₦54, a low of ₦49, and closes at ₦53. The body runs from ₦50 to ₦53 and it is an up candle. The wicks stretch to ₦54 and ₦49."
                    }
                },
                {
                    "title": "Choose your timeframe",
                    "body": [
                        "Most charts let you pick a timeframe, such as 1 day, 1 month or 1 year. Each candle then covers that much time.",
                        "The same stock can look very different depending on the timeframe. A short one shows small daily swings. A long one shows the bigger picture."
                    ],
                    "tryIt": {
                        "target": "explorer",
                        "label": "Browse stocks in Explorer",
                        "prefill": {}
                    }
                },
                {
                    "title": "Quick recap",
                    "body": [
                        "A chart shows what a price did. It cannot tell you what it will do next."
                    ],
                    "bullets": [
                        "Line charts join closing prices.",
                        "Candlesticks show open, high, low and close.",
                        "Pick a timeframe that matches your question."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "rc-1",
                        "q": "What does a simple line chart usually join together?",
                        "options": ["Closing prices over time", "Broker fees", "Dividend payments", "Company profits"],
                        "answer": 0,
                        "explain": "A line chart joins the closing price of each period."
                    },
                    {
                        "id": "rc-2",
                        "q": "What does the bottom (horizontal) axis of a price chart show?",
                        "options": ["Price", "Volume", "Time", "Market cap"],
                        "answer": 2,
                        "explain": "Time runs along the bottom and price is on the side."
                    },
                    {
                        "id": "rc-3",
                        "q": "Which four prices does a candlestick show?",
                        "options": ["Bid, ask, spread and volume", "Open, high, low and close", "Buy, sell, fee and tax", "Day, week, month and year"],
                        "answer": 1,
                        "explain": "Each candle shows the open, high, low and close for its period."
                    },
                    {
                        "id": "rc-4",
                        "q": "What is the thick part of a candlestick called?",
                        "options": ["The wick", "The ticker", "The spread", "The body"],
                        "answer": 3,
                        "explain": "The body runs from the open to the close."
                    },
                    {
                        "id": "rc-5",
                        "q": "What are the thin lines above and below a candle’s body?",
                        "options": ["Wicks", "Bodies", "Tickers", "Indexes"],
                        "answer": 0,
                        "explain": "Wicks reach up to the high and down to the low."
                    },
                    {
                        "id": "rc-6",
                        "q": "When is a candle an “up candle”?",
                        "options": ["When volume is high", "When the close is higher than the open", "When the open is higher than the close", "When the wicks are long"],
                        "answer": 1,
                        "explain": "An up candle means the price closed above where it opened."
                    },
                    {
                        "id": "rc-7",
                        "q": "A stock opens at ₦50 and closes at ₦47. What kind of candle is it?",
                        "options": ["An up candle", "No candle", "Cannot tell", "A down candle"],
                        "answer": 3,
                        "explain": "It closed lower than it opened, so it is a down candle."
                    },
                    {
                        "id": "rc-8",
                        "q": "What does the top of the upper wick show?",
                        "options": ["The open", "The highest price of the period", "The volume", "The close"],
                        "answer": 1,
                        "explain": "The upper wick reaches up to the high."
                    },
                    {
                        "id": "rc-9",
                        "q": "What is true about candle colours?",
                        "options": ["Red always means profit", "Colours show company size", "Colours can differ between apps, so check the key", "Every app uses the same colours"],
                        "answer": 2,
                        "explain": "Many apps use green for up and red for down, but not all do."
                    },
                    {
                        "id": "rc-10",
                        "q": "Why might you pick a 1-year timeframe?",
                        "options": ["To see the longer-term picture", "To guarantee a profit", "To change the price", "To see today’s bid and ask"],
                        "answer": 0,
                        "explain": "Longer timeframes show the bigger picture."
                    },
                    {
                        "id": "rc-11",
                        "q": "Why can the same stock look different on a 1-day and a 1-year chart?",
                        "options": ["The price is different on each chart", "Each timeframe covers a different stretch of movement", "The exchange changes the data", "One of the charts is wrong"],
                        "answer": 1,
                        "explain": "Short charts show small swings. Long charts show the wider trend."
                    },
                    {
                        "id": "rc-12",
                        "q": "A candle has a long lower wick. What does that suggest?",
                        "options": ["The price dropped low during the period but came back up", "The company paid a dividend", "Nobody traded the stock", "The price never moved"],
                        "answer": 0,
                        "explain": "The low was far below the body, so the price fell and then recovered."
                    },
                    {
                        "id": "rc-13",
                        "q": "An up candle opens at ₦100, reaches ₦108, falls to ₦98 and closes at ₦105. Where does the body start?",
                        "options": ["₦98", "₦108", "₦105", "₦100"],
                        "answer": 3,
                        "explain": "The body runs from the open (₦100) to the close (₦105)."
                    },
                    {
                        "id": "rc-14",
                        "q": "What can a candlestick show that a simple line chart of closes does not?",
                        "options": ["The company name", "The ticker", "How high and low the price went within the period", "The dividend"],
                        "answer": 2,
                        "explain": "Candles include the high and low, not just the close."
                    },
                    {
                        "id": "rc-15",
                        "q": "What can a price chart tell you?",
                        "options": ["Tomorrow’s price", "Whether you will profit", "What the price did in the past", "When the company will pay a dividend"],
                        "answer": 2,
                        "explain": "A chart shows history. It does not predict the future."
                    }
                ]
            }
        },

        {
            "id": "trends-support-resistance",
            "title": "Trends, support and resistance",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "What is a trend?",
                    "body": [
                        "A **trend** is the general direction a price is moving over time. Prices zigzag, but the zigzags often lean one way."
                    ],
                    "bullets": [
                        "An **uptrend** has higher highs and higher lows.",
                        "A **downtrend** has lower highs and lower lows.",
                        "A **sideways** market moves in a range with no clear direction."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Peaks at ₦50, ₦55 and ₦60, with dips at ₦45, ₦50 and ₦54, make an uptrend. Each high and each low is above the one before."
                    }
                },
                {
                    "title": "Support: the floor",
                    "body": [
                        "**Support** is a price level where a falling price has often stopped and bounced. Buyers tend to step in there because they think the price is good value."
                    ],
                    "example": {
                        "label": "Imagine this",
                        "text": "A stock keeps dropping to about ₦100 and then rising again. Traders say ₦100 is its support."
                    }
                },
                {
                    "title": "Resistance: the ceiling",
                    "body": [
                        "**Resistance** is a price level where a rising price has often stalled and turned down. Sellers tend to appear there because they want to take profit.",
                        "If a stock bounces between ₦100 and ₦120 for weeks, ₦100 is support and ₦120 is resistance."
                    ]
                },
                {
                    "title": "Breakouts and false alarms",
                    "body": [
                        "A **breakout** happens when the price moves above resistance or below support. Some investors see it as a sign of a new trend.",
                        "Breakouts can fail. A **false breakout** is when the price pushes past a level and then falls back. A breakout on high volume is generally seen as more convincing than one on low volume."
                    ]
                },
                {
                    "title": "Quick recap",
                    "body": [
                        "These tools are guides, not guarantees."
                    ],
                    "bullets": [
                        "Trends can be up, down or sideways, and they can end.",
                        "Support is a floor and resistance is a ceiling, but both can fail.",
                        "Two people can draw different levels on the same chart. It takes judgement."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "tsr-1",
                        "q": "What describes an uptrend?",
                        "options": ["Higher highs and higher lows", "Lower highs and lower lows", "No price changes", "Only one trade a day"],
                        "answer": 0,
                        "explain": "In an uptrend each peak and dip is above the one before."
                    },
                    {
                        "id": "tsr-2",
                        "q": "What describes a downtrend?",
                        "options": ["Higher highs and higher lows", "A price that never moves", "Lower highs and lower lows", "Rising volume only"],
                        "answer": 2,
                        "explain": "In a downtrend each peak and dip is below the one before."
                    },
                    {
                        "id": "tsr-3",
                        "q": "What is a sideways market?",
                        "options": ["A market that is closed", "A price that only rises", "A price that only falls", "A price moving in a range with no clear direction"],
                        "answer": 3,
                        "explain": "Sideways means the price moves up and down within a range."
                    },
                    {
                        "id": "tsr-4",
                        "q": "What is support?",
                        "options": ["A broker’s helpline", "A price level where a falling price often stops and bounces", "The highest price ever", "A fee paid to the exchange"],
                        "answer": 1,
                        "explain": "Support is a floor where buyers tend to step in."
                    },
                    {
                        "id": "tsr-5",
                        "q": "What is resistance?",
                        "options": ["A price level where a rising price often stalls", "The lowest price ever", "A type of dividend", "The company’s profit"],
                        "answer": 0,
                        "explain": "Resistance is a ceiling where sellers tend to appear."
                    },
                    {
                        "id": "tsr-6",
                        "q": "A stock bounces between ₦100 and ₦120 for weeks. Which level is resistance?",
                        "options": ["₦100", "₦110", "₦120", "₦0"],
                        "answer": 2,
                        "explain": "₦120 is the ceiling the price keeps failing to pass."
                    },
                    {
                        "id": "tsr-7",
                        "q": "In the same example (₦100 to ₦120), which level is support?",
                        "options": ["₦120", "₦100", "₦150", "₦110"],
                        "answer": 1,
                        "explain": "₦100 is the floor where the price keeps bouncing."
                    },
                    {
                        "id": "tsr-8",
                        "q": "What is a breakout?",
                        "options": ["A broker leaving the market", "A dividend payment", "A new share offering", "The price moving above resistance or below support"],
                        "answer": 3,
                        "explain": "A breakout is a move beyond a support or resistance level."
                    },
                    {
                        "id": "tsr-9",
                        "q": "What is a false breakout?",
                        "options": ["The price breaks a level and then falls back", "A breakout confirmed by news", "A chart error", "A rule set by the exchange"],
                        "answer": 0,
                        "explain": "The price pushes past a level but then returns, so the move failed."
                    },
                    {
                        "id": "tsr-10",
                        "q": "Is a support level guaranteed to hold?",
                        "options": ["Yes, always", "Yes, for large companies", "Only on the NGX", "No, levels can fail"],
                        "answer": 3,
                        "explain": "Support and resistance are guides. Prices can break through them."
                    },
                    {
                        "id": "tsr-11",
                        "q": "Peaks at ₦50, ₦55, ₦60 and dips at ₦45, ₦50, ₦54. What is the trend?",
                        "options": ["Downtrend", "Uptrend", "Sideways", "No pattern is possible"],
                        "answer": 1,
                        "explain": "Both the highs and the lows are rising, which is an uptrend."
                    },
                    {
                        "id": "tsr-12",
                        "q": "Why is it useful to look at a longer timeframe when judging a trend?",
                        "options": ["It guarantees the trend continues", "It removes all risk", "It shows the bigger picture and less day-to-day noise", "It changes the price"],
                        "answer": 2,
                        "explain": "Short-term zigzags can hide the real direction."
                    },
                    {
                        "id": "tsr-13",
                        "q": "Two people draw different support lines on the same chart. What does this show?",
                        "options": ["One chart is fake", "Reading charts involves judgement", "The exchange made a mistake", "Support does not exist"],
                        "answer": 1,
                        "explain": "There is no single correct line. People read charts differently."
                    },
                    {
                        "id": "tsr-14",
                        "q": "Why be careful with a breakout on very low volume?",
                        "options": ["It always succeeds", "It means the company is large", "It cancels dividends", "It may be a weak move that fails"],
                        "answer": 3,
                        "explain": "Few trades behind a move make it less convincing."
                    },
                    {
                        "id": "tsr-15",
                        "q": "Which statement about trends is true?",
                        "options": ["A trend can end or reverse", "A trend lasts forever", "Trends only happen in the US", "A trend guarantees profit"],
                        "answer": 0,
                        "explain": "Trends change. No trend is guaranteed to continue."
                    }
                ]
            }
        },

        {
            "id": "volume-and-moving-averages",
            "title": "Volume and moving averages",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "Volume on a chart",
                    "body": [
                        "Most charts show **volume** as bars under the price. Each bar is the number of shares traded in that period.",
                        "Volume tells you how many people took part in a move. A rise on high volume is generally seen as stronger than a rise on very few trades."
                    ],
                    "example": {
                        "label": "Think about it",
                        "text": "A stock jumps 8% and the volume bar is five times bigger than usual. Many investors were involved. If the volume bar is tiny, the jump may mean little."
                    }
                },
                {
                    "title": "What is a moving average?",
                    "body": [
                        "Prices jump around from day to day. A **moving average** smooths this out. It is the average of the last set number of closing prices, redrawn each day as a line on the chart."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "The last 5 closes are ₦10, ₦12, ₦11, ₦13 and ₦14. Add them up to get ₦60 and divide by 5. The 5-day moving average is ₦12."
                    }
                },
                {
                    "title": "Short and long averages",
                    "body": [
                        "A short average, such as 10 days, reacts quickly to price changes. A long one, such as 200 days, moves slowly and shows the bigger trend.",
                        "Some investors see a price above its long average as a sign of an uptrend, and below it as a downtrend. When a short average crosses a long one, it is called a **crossover**. Some people watch it as a signal, but it can be wrong."
                    ]
                },
                {
                    "title": "A look backwards",
                    "body": [
                        "A moving average is built from past prices, so it **lags**. It tells you what has already happened, not what comes next.",
                        "Use it as one clue next to others, such as trend, volume and the company’s own news."
                    ],
                    "bullets": [
                        "Volume shows how many shares traded.",
                        "A moving average smooths the price into a trend line.",
                        "Neither can predict the future."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "vma-1",
                        "q": "What does a volume bar on a chart show?",
                        "options": ["The number of shares traded in that period", "The company’s profit", "The broker’s fee", "The closing price"],
                        "answer": 0,
                        "explain": "Volume counts the shares traded in each period."
                    },
                    {
                        "id": "vma-2",
                        "q": "A price rises on very high volume. What does this suggest?",
                        "options": ["Nobody was interested", "The price will fall tomorrow", "The company paid a dividend", "Many investors took part in the move"],
                        "answer": 3,
                        "explain": "High volume means lots of activity, which makes a move more convincing."
                    },
                    {
                        "id": "vma-3",
                        "q": "A stock jumps 8% on very few trades. How much weight should you give it?",
                        "options": ["Less, since few people took part", "Full weight, it will keep rising", "None, charts are useless", "More, because the price is higher"],
                        "answer": 0,
                        "explain": "A jump on low volume may not mean much."
                    },
                    {
                        "id": "vma-4",
                        "q": "What is a moving average?",
                        "options": ["The highest price this year", "The average of recent closing prices over a set number of days", "The average broker fee", "The price a stock opened at"],
                        "answer": 1,
                        "explain": "It averages the last set number of closes and updates each day."
                    },
                    {
                        "id": "vma-5",
                        "q": "The last 5 closes are ₦10, ₦12, ₦11, ₦13 and ₦14. What is the 5-day moving average?",
                        "options": ["₦10", "₦14", "₦13", "₦12"],
                        "answer": 3,
                        "explain": "10 + 12 + 11 + 13 + 14 = 60, and 60 divided by 5 is 12."
                    },
                    {
                        "id": "vma-6",
                        "q": "The last 3 closes are ₦20, ₦22 and ₦24. What is the 3-day moving average?",
                        "options": ["₦22", "₦20", "₦24", "₦66"],
                        "answer": 0,
                        "explain": "20 + 22 + 24 = 66, and 66 divided by 3 is 22."
                    },
                    {
                        "id": "vma-7",
                        "q": "Why do people use a moving average?",
                        "options": ["To set the share price", "To smooth out day-to-day noise", "To pay dividends", "To avoid all risk"],
                        "answer": 1,
                        "explain": "Averaging reduces small daily swings so the trend is easier to see."
                    },
                    {
                        "id": "vma-8",
                        "q": "Which reacts faster to price changes?",
                        "options": ["A 200-day average", "Neither reacts", "They react the same", "A 10-day average"],
                        "answer": 3,
                        "explain": "Fewer days means the average follows the price more closely."
                    },
                    {
                        "id": "vma-9",
                        "q": "Why is a moving average called a “lagging” measure?",
                        "options": ["It is built from past prices", "It predicts next week", "It only works on Mondays", "It ignores prices"],
                        "answer": 0,
                        "explain": "It reflects what has already happened."
                    },
                    {
                        "id": "vma-10",
                        "q": "A price is above its 200-day average. How do some investors read this?",
                        "options": ["As a guaranteed profit", "As a sign the company will pay a dividend", "As a sign of a longer-term uptrend", "As a sign the stock is closed"],
                        "answer": 2,
                        "explain": "Many see it as a hint of an uptrend, though it is not a guarantee."
                    },
                    {
                        "id": "vma-11",
                        "q": "A new daily close arrives. What happens to a 5-day moving average?",
                        "options": ["It stays the same forever", "It adds all prices ever recorded", "It is deleted", "The oldest day drops out and the newest is added"],
                        "answer": 3,
                        "explain": "The window moves forward by one day, which is why it is “moving”."
                    },
                    {
                        "id": "vma-12",
                        "q": "What is a crossover?",
                        "options": ["Two brokers merging", "A short average crossing a long average", "A stock moving between exchanges", "A dividend date"],
                        "answer": 1,
                        "explain": "It is when a short moving average crosses above or below a long one."
                    },
                    {
                        "id": "vma-13",
                        "q": "Which of these counts the number of shares traded?",
                        "options": ["The moving average", "The ticker", "Volume", "The spread"],
                        "answer": 2,
                        "explain": "Volume is the number of shares that changed hands."
                    },
                    {
                        "id": "vma-14",
                        "q": "Which average gives the smoother, slower-moving line?",
                        "options": ["A 5-day average", "A 100-day average", "A 2-day average", "The last price"],
                        "answer": 1,
                        "explain": "More days in the average means a smoother line that reacts more slowly."
                    },
                    {
                        "id": "vma-15",
                        "q": "Can volume or moving averages predict future prices?",
                        "options": ["No, they only help you read what has happened", "Yes, always", "Yes, for big companies", "Yes, on the NGX only"],
                        "answer": 0,
                        "explain": "They are clues about the past. Nothing here can promise what comes next."
                    }
                ]
            }
        }
    ]
},

        /* ============================================
   COMPANY BASICS: drop-in track

   In learn-content.js, find the track with
   "id": "company-basics" and replace that whole
   { ... } object with the one below.
   Lessons: 3, each with 15 questions (5 asked per try).
   ============================================ */

{
    "id": "company-basics",
    "title": "Company Basics",
    "summary": "Earnings, P/E and dividends in plain English.",
    "level": "Intermediate",
    "theme": "green",
    "icon": "fa-building",
    "lessons": [
        {
            "id": "revenue-profit-earnings",
            "title": "Revenue, profit and earnings",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "Revenue: money coming in",
                    "body": [
                        "**Revenue** is the money a company brings in from selling its products or services, before any costs are taken off. People also call it sales or the “top line”."
                    ],
                    "example": {
                        "label": "Imagine this",
                        "text": "A bakery sells 100,000 loaves in a year at ₦500 each. Its revenue is ₦50 million."
                    }
                },
                {
                    "title": "From revenue to profit",
                    "body": [
                        "A company has costs: ingredients, wages, rent, interest on loans and taxes. **Profit** is what is left after those costs come off revenue.",
                        "The final number, after interest and taxes, is called **net income**. It is the “bottom line”. When people talk about a company’s **earnings**, they usually mean this."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A company has revenue of ₦10 billion and total costs of ₦8 billion. Its profit is ₦2 billion."
                    }
                },
                {
                    "title": "Profit margin",
                    "body": [
                        "The **profit margin** shows how much of each naira of revenue turns into profit. Divide profit by revenue.",
                        "Margins let you compare companies of different sizes. A small firm with a higher margin can be more efficient than a giant with a thin one."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Profit of ₦2 billion on revenue of ₦10 billion is a margin of 20%. That means ₦20 of profit for every ₦100 of sales."
                    }
                },
                {
                    "title": "Growth: up, down or flat",
                    "body": [
                        "**Revenue growth** compares revenue now with an earlier period. Revenue rising from ₦10 billion to ₦12 billion is growth of 20% (2 divided by 10).",
                        "Revenue and profit do not always move together. A company can sell more and still earn less if its costs rise faster."
                    ]
                },
                {
                    "title": "Where to find the numbers",
                    "body": [
                        "Listed companies publish their results regularly. An **earnings report** covers a period such as a quarter or half-year. The **annual report** covers the full financial year in much more detail.",
                        "Use these official documents rather than rumours or social media posts."
                    ],
                    "bullets": [
                        "Revenue is money in. Profit is what is left after costs.",
                        "Net income is the bottom line.",
                        "Margins help compare companies of different sizes."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "crp-1",
                        "q": "What is revenue?",
                        "options": ["Money a company brings in from sales, before costs", "The profit left after all costs", "The price of one share", "Money a company owes"],
                        "answer": 0,
                        "explain": "Revenue is sales income before any costs are taken off."
                    },
                    {
                        "id": "crp-2",
                        "q": "A bakery sells 100,000 loaves at ₦500 each. What is its revenue?",
                        "options": ["₦500,000", "₦5 million", "₦100,000", "₦50 million"],
                        "answer": 3,
                        "explain": "100,000 × ₦500 = ₦50,000,000, or ₦50 million."
                    },
                    {
                        "id": "crp-3",
                        "q": "How is profit worked out?",
                        "options": ["Revenue plus costs", "Revenue minus costs", "Share price times shares", "Costs divided by revenue"],
                        "answer": 1,
                        "explain": "Profit is what is left of revenue after costs are taken off."
                    },
                    {
                        "id": "crp-4",
                        "q": "A company has revenue of ₦10 billion and costs of ₦8 billion. What is its profit?",
                        "options": ["₦18 billion", "₦8 billion", "₦10 billion", "₦2 billion"],
                        "answer": 3,
                        "explain": "₦10 billion minus ₦8 billion is ₦2 billion."
                    },
                    {
                        "id": "crp-5",
                        "q": "What is net income?",
                        "options": ["Profit after costs, interest and taxes", "Revenue before costs", "The company’s total debts", "The value of all its shares"],
                        "answer": 0,
                        "explain": "Net income is the bottom line, after all costs, interest and taxes."
                    },
                    {
                        "id": "crp-6",
                        "q": "How do you calculate a profit margin?",
                        "options": ["Revenue divided by profit", "Profit divided by revenue", "Profit plus revenue", "Share price divided by profit"],
                        "answer": 1,
                        "explain": "Margin is profit divided by revenue, usually shown as a percentage."
                    },
                    {
                        "id": "crp-7",
                        "q": "Profit is ₦2 billion on revenue of ₦10 billion. What is the profit margin?",
                        "options": ["2%", "5%", "20%", "80%"],
                        "answer": 2,
                        "explain": "2 divided by 10 is 0.2, which is 20%."
                    },
                    {
                        "id": "crp-8",
                        "q": "A company earns ₦5 million profit on ₦50 million revenue. What is its margin?",
                        "options": ["10%", "5%", "50%", "1%"],
                        "answer": 0,
                        "explain": "5 divided by 50 is 0.1, which is 10%."
                    },
                    {
                        "id": "crp-9",
                        "q": "Revenue rises from ₦10 billion to ₦12 billion. What is the revenue growth?",
                        "options": ["2%", "12%", "10%", "20%"],
                        "answer": 3,
                        "explain": "The rise is ₦2 billion. 2 divided by 10 is 0.2, or 20%."
                    },
                    {
                        "id": "crp-10",
                        "q": "Can a company’s revenue rise while its profit falls?",
                        "options": ["No, they always move together", "Only for banks", "Yes, if costs rise faster than revenue", "Only if the share price falls"],
                        "answer": 2,
                        "explain": "If costs grow faster than sales, profit can shrink even as revenue grows."
                    },
                    {
                        "id": "crp-11",
                        "q": "When people talk about a company’s “earnings”, what do they usually mean?",
                        "options": ["Its profit, often net income", "Its revenue only", "Its share price", "Its number of shares"],
                        "answer": 0,
                        "explain": "Earnings usually means the company’s profit."
                    },
                    {
                        "id": "crp-12",
                        "q": "What does an earnings report show?",
                        "options": ["Tomorrow’s share price", "A guarantee of dividends", "How the company performed financially in a period", "The broker’s fees"],
                        "answer": 2,
                        "explain": "It reports results such as revenue and profit for a quarter or other period."
                    },
                    {
                        "id": "crp-13",
                        "q": "How is an annual report different from a quarterly earnings report?",
                        "options": ["It only shows the share price", "It covers a full financial year in more detail", "It is written by the exchange", "It covers only one day"],
                        "answer": 1,
                        "explain": "The annual report covers the whole year and goes into far more detail."
                    },
                    {
                        "id": "crp-14",
                        "q": "Why is profit margin useful when comparing two companies?",
                        "options": ["It sets their share prices", "It guarantees future growth", "It shows their ticker codes", "It works for companies of any size"],
                        "answer": 3,
                        "explain": "A percentage lets you compare a small company with a large one fairly."
                    },
                    {
                        "id": "crp-15",
                        "q": "Company A has ₦100 million revenue and ₦20 million profit. Company B has ₦500 million revenue and ₦50 million profit. Which has the higher margin?",
                        "options": ["Company A (20%)", "Company B (10%)", "They are equal", "You cannot tell"],
                        "answer": 0,
                        "explain": "A: 20 ÷ 100 = 20%. B: 50 ÷ 500 = 10%. B earns more naira, but A keeps more of each sale."
                    }
                ]
            }
        },

        {
            "id": "eps-and-pe-ratio",
            "title": "EPS and the P/E ratio",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "Earnings per share",
                    "body": [
                        "A company’s profit is shared among all its shares. **Earnings per share (EPS)** tells you how much profit belongs to each one. Divide net income by the number of shares."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A company has net income of ₦1 billion and 100 million shares. EPS is ₦1,000,000,000 ÷ 100,000,000 = ₦10."
                    }
                },
                {
                    "title": "The P/E ratio",
                    "body": [
                        "The **P/E ratio** compares the share price with EPS. Divide the price by EPS.",
                        "It tells you roughly how many naira investors pay for each ₦1 of the company’s yearly earnings."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A share costs ₦100 and EPS is ₦10. The P/E is 100 ÷ 10 = 10. Investors pay ₦10 for each ₦1 of yearly earnings."
                    }
                },
                {
                    "title": "High or low?",
                    "body": [
                        "There is no “right” P/E. A **high P/E** can mean investors expect strong growth, or that the stock is expensive. A **low P/E** can mean good value, or that investors worry about the business.",
                        "The best use of P/E is to compare similar companies, such as two banks, or one company with its own past."
                    ]
                },
                {
                    "title": "A low price is not a cheap price",
                    "body": [
                        "A share price alone says nothing about value. You must look at what you get for it.",
                        "Stock A costs ₦10 and earns ₦0.50 a share, so its P/E is 20. Stock B costs ₦200 and earns ₦40 a share, so its P/E is 5. The ₦200 stock is the cheaper of the two compared with earnings."
                    ]
                },
                {
                    "title": "Limits to remember",
                    "body": [
                        "P/E is a starting point, not a verdict."
                    ],
                    "bullets": [
                        "If a company makes a loss, EPS is negative and the P/E is not meaningful.",
                        "One-off gains can make EPS look better than the real business.",
                        "P/E uses past earnings, which may not repeat.",
                        "Use it with other measures, such as growth, debt and dividends."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "pe-1",
                        "q": "How do you calculate EPS?",
                        "options": ["Net income divided by the number of shares", "Share price divided by net income", "Revenue minus costs", "Dividends divided by price"],
                        "answer": 0,
                        "explain": "EPS is net income divided by the number of shares."
                    },
                    {
                        "id": "pe-2",
                        "q": "A company has net income of ₦1 billion and 100 million shares. What is EPS?",
                        "options": ["₦1", "₦100", "₦1,000", "₦10"],
                        "answer": 3,
                        "explain": "₦1,000,000,000 ÷ 100,000,000 = ₦10."
                    },
                    {
                        "id": "pe-3",
                        "q": "Net income is ₦600 million and there are 200 million shares. What is EPS?",
                        "options": ["₦300", "₦3", "₦0.30", "₦30"],
                        "answer": 1,
                        "explain": "600 million ÷ 200 million = ₦3."
                    },
                    {
                        "id": "pe-4",
                        "q": "How do you calculate the P/E ratio?",
                        "options": ["EPS divided by share price", "Dividend divided by EPS", "Share price divided by EPS", "Revenue divided by shares"],
                        "answer": 2,
                        "explain": "P/E is the share price divided by earnings per share."
                    },
                    {
                        "id": "pe-5",
                        "q": "A share costs ₦100 and EPS is ₦10. What is the P/E?",
                        "options": ["10", "100", "1", "0.1"],
                        "answer": 0,
                        "explain": "100 ÷ 10 = 10."
                    },
                    {
                        "id": "pe-6",
                        "q": "A share costs ₦45 and EPS is ₦3. What is the P/E?",
                        "options": ["3", "135", "15", "48"],
                        "answer": 2,
                        "explain": "45 ÷ 3 = 15."
                    },
                    {
                        "id": "pe-7",
                        "q": "What does a P/E of 10 roughly mean?",
                        "options": ["The stock will rise 10%", "Investors pay ₦10 for each ₦1 of yearly earnings", "The company pays a 10% dividend", "The stock is guaranteed to be cheap"],
                        "answer": 1,
                        "explain": "P/E shows how much investors pay for each naira of earnings."
                    },
                    {
                        "id": "pe-8",
                        "q": "What might a high P/E suggest?",
                        "options": ["The company is bankrupt", "Nobody is trading the stock", "The company has no earnings", "Investors expect strong growth, or the stock is expensive"],
                        "answer": 3,
                        "explain": "A high P/E can reflect growth hopes or a high price."
                    },
                    {
                        "id": "pe-9",
                        "q": "What might a low P/E suggest?",
                        "options": ["Good value, or worries about the business", "The company is certain to grow", "The dividend is guaranteed", "The stock cannot fall"],
                        "answer": 0,
                        "explain": "A low P/E can mean a bargain or that investors see problems."
                    },
                    {
                        "id": "pe-10",
                        "q": "What is the best way to use P/E?",
                        "options": ["Compare it with similar companies in the same industry", "Compare a bank with a cement maker", "Treat it as a buy signal", "Ignore it completely"],
                        "answer": 0,
                        "explain": "Compare like with like, such as two banks."
                    },
                    {
                        "id": "pe-11",
                        "q": "A company makes a loss this year. What happens to its P/E?",
                        "options": ["It becomes zero", "It is not meaningful", "It doubles", "It becomes 100"],
                        "answer": 1,
                        "explain": "With negative EPS, the P/E ratio does not give a useful number."
                    },
                    {
                        "id": "pe-12",
                        "q": "The share price stays at ₦100 but EPS rises from ₦10 to ₦20. What happens to the P/E?",
                        "options": ["It rises to 20", "It stays at 10", "It becomes 100", "It falls to 5"],
                        "answer": 3,
                        "explain": "100 ÷ 20 = 5. Earnings grew, so each naira of earnings costs less."
                    },
                    {
                        "id": "pe-13",
                        "q": "EPS stays the same and the share price doubles. What happens to the P/E?",
                        "options": ["It halves", "It doubles", "It stays the same", "It becomes zero"],
                        "answer": 1,
                        "explain": "The price is on top of the fraction, so a doubled price doubles the P/E."
                    },
                    {
                        "id": "pe-14",
                        "q": "Stock A costs ₦10 with EPS ₦0.50. Stock B costs ₦200 with EPS ₦40. Which has the lower P/E?",
                        "options": ["Stock A (20)", "They are equal", "Stock B (5)", "Neither has a P/E"],
                        "answer": 2,
                        "explain": "A: 10 ÷ 0.50 = 20. B: 200 ÷ 40 = 5. A low share price does not mean a low P/E."
                    },
                    {
                        "id": "pe-15",
                        "q": "Can the P/E ratio alone tell you whether a stock is a good investment?",
                        "options": ["Yes, a low P/E always means buy", "Yes, a high P/E always means sell", "Only for US stocks", "No, it is one clue to use with other measures"],
                        "answer": 3,
                        "explain": "P/E is a starting point. Look at growth, debt, dividends and the business too."
                    }
                ]
            }
        },

        {
            "id": "dividends-explained",
            "title": "Dividends explained",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "Sharing the profit",
                    "body": [
                        "A **dividend** is a part of a company’s profit that it pays to its shareholders. The amount for each share is the **dividend per share**.",
                        "Dividends are a choice. The company’s board decides whether to pay one and how much."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A company pays ₦3 per share. You own 100 shares, so you receive ₦300, before any tax or deductions."
                    }
                },
                {
                    "title": "Dividend yield",
                    "body": [
                        "The **dividend yield** compares the yearly dividend with the share price. Divide the dividend per share by the price.",
                        "Yield changes when the price changes. If the price falls and the dividend stays the same, the yield rises."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A share pays ₦5 a year and costs ₦100. The yield is 5 ÷ 100 = 5%. If the price drops to ₦50, the same ₦5 is a 10% yield."
                    }
                },
                {
                    "title": "Payout ratio",
                    "body": [
                        "The **payout ratio** shows how much of earnings goes to dividends. Divide the dividend per share by EPS.",
                        "A very high ratio can be hard to keep up, because little profit is left to grow the business. A company that pays no dividend is not necessarily weak. It may be putting every naira back into growth."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "EPS is ₦10 and the dividend is ₦4. The payout ratio is 4 ÷ 10 = 40%."
                    }
                },
                {
                    "title": "The dividend dates",
                    "body": [
                        "A dividend follows a timeline. Always check the dates in the company’s announcement."
                    ],
                    "bullets": [
                        "**Record date:** the day the company checks its list of shareholders.",
                        "**Ex-dividend date:** if you buy on or after this day, you generally do not get the upcoming dividend.",
                        "**Payment date:** the day the money is paid out."
                    ]
                },
                {
                    "title": "Quick recap",
                    "body": [
                        "Dividends are welcome, but they are never certain."
                    ],
                    "bullets": [
                        "Yield is dividend divided by price.",
                        "Payout ratio is dividend divided by EPS.",
                        "A company can cut or stop a dividend at any time."
                    ]
                }
            ],
            "sources": [
                {
                    "label": "Investor.gov (US SEC)",
                    "url": "https://www.investor.gov/"
                }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "div-1",
                        "q": "What is a dividend?",
                        "options": ["A fee paid to a broker", "A loan from the company", "The price of one share", "Part of a company’s profit paid to shareholders"],
                        "answer": 3,
                        "explain": "A dividend is a share of profit paid out to shareholders."
                    },
                    {
                        "id": "div-2",
                        "q": "A company pays ₦3 per share and you own 100 shares. What do you receive, before tax?",
                        "options": ["₦300", "₦3", "₦30", "₦3,000"],
                        "answer": 0,
                        "explain": "100 × ₦3 = ₦300."
                    },
                    {
                        "id": "div-3",
                        "q": "A company pays ₦2 per share and you own 500 shares. What do you receive, before tax?",
                        "options": ["₦250", "₦2,500", "₦1,000", "₦100"],
                        "answer": 2,
                        "explain": "500 × ₦2 = ₦1,000."
                    },
                    {
                        "id": "div-4",
                        "q": "How do you calculate dividend yield?",
                        "options": ["Share price divided by the dividend", "EPS divided by the dividend", "Revenue divided by shares", "Yearly dividend per share divided by the share price"],
                        "answer": 3,
                        "explain": "Yield is the yearly dividend per share divided by the price."
                    },
                    {
                        "id": "div-5",
                        "q": "A share pays ₦5 a year and costs ₦100. What is the dividend yield?",
                        "options": ["20%", "5%", "50%", "0.5%"],
                        "answer": 1,
                        "explain": "5 ÷ 100 = 0.05, which is 5%."
                    },
                    {
                        "id": "div-6",
                        "q": "A share pays ₦6 a year and costs ₦200. What is the dividend yield?",
                        "options": ["6%", "33%", "12%", "3%"],
                        "answer": 3,
                        "explain": "6 ÷ 200 = 0.03, which is 3%."
                    },
                    {
                        "id": "div-7",
                        "q": "The share price falls but the yearly dividend stays the same. What happens to the yield?",
                        "options": ["It rises", "It falls", "It stays the same", "It becomes zero"],
                        "answer": 0,
                        "explain": "The same dividend divided by a lower price gives a higher yield."
                    },
                    {
                        "id": "div-8",
                        "q": "What does the payout ratio show?",
                        "options": ["How much the share price changed", "How many shares were sold", "How much of earnings is paid out as dividends", "How much debt a company has"],
                        "answer": 2,
                        "explain": "It compares the dividend with earnings per share."
                    },
                    {
                        "id": "div-9",
                        "q": "EPS is ₦10 and the dividend is ₦4. What is the payout ratio?",
                        "options": ["4%", "40%", "60%", "250%"],
                        "answer": 1,
                        "explain": "4 ÷ 10 = 0.4, which is 40%."
                    },
                    {
                        "id": "div-10",
                        "q": "Why can a payout ratio above 100% be a concern?",
                        "options": ["It means the share price will rise", "It is illegal", "The company pays out more than it earns, which may be hard to keep up", "It means no dividend is paid"],
                        "answer": 2,
                        "explain": "Paying more than it earns cannot last for long."
                    },
                    {
                        "id": "div-11",
                        "q": "A company pays no dividend. What does that tell you?",
                        "options": ["It is bankrupt", "It must be a bad company", "It is breaking the rules", "Not necessarily bad. It may reinvest profit to grow"],
                        "answer": 3,
                        "explain": "Many healthy companies keep their profit to grow the business."
                    },
                    {
                        "id": "div-12",
                        "q": "What generally happens if you buy a share on or after the ex-dividend date?",
                        "options": ["You do not get the upcoming dividend", "You get double the dividend", "You get the dividend early", "The dividend is cancelled"],
                        "answer": 0,
                        "explain": "The ex-dividend date is the cutoff. Buy on or after it and you generally miss that dividend."
                    },
                    {
                        "id": "div-13",
                        "q": "What is the record date?",
                        "options": ["The day the dividend is paid", "The day the share price peaks", "The day the company checks who its shareholders are", "The company’s birthday"],
                        "answer": 2,
                        "explain": "The company uses its shareholder list on the record date to see who is entitled."
                    },
                    {
                        "id": "div-14",
                        "q": "What is the payment date?",
                        "options": ["The day the dividend money is paid out", "The day the dividend is announced", "The last day to buy shares", "The day the company reports earnings"],
                        "answer": 0,
                        "explain": "The payment date is when shareholders actually receive the dividend."
                    },
                    {
                        "id": "div-15",
                        "q": "Are dividends guaranteed?",
                        "options": ["Yes, for every listed company", "Yes, if you hold for a year", "No, a company can cut or stop them", "Only on the NGX"],
                        "answer": 2,
                        "explain": "Dividends are a choice. Companies can reduce or stop them."
                    }
                ]
            }
        }
    ]
},

/* ============================================
   READING FINANCIAL STATEMENTS: drop-in track
   Put this object right after "company-basics" in the tracks array.
   4 lessons, 15 questions each (5 asked per try).
   All company figures are made up for teaching.
   ============================================ */
{
    "id": "reading-financial-statements",
    "title": "Reading Financial Statements",
    "summary": "Balance sheet, cash flow and debt, line by line.",
    "level": "Intermediate",
    "theme": "green",
    "icon": "fa-file-invoice-dollar",
    "lessons": [
        {
            "id": "the-balance-sheet",
            "title": "The balance sheet",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "A snapshot of what a company owns and owes",
                    "body": [
                        "The income statement covers a period, such as a year. The **balance sheet** is a snapshot on one date. It lists what the company **owns** (assets), what it **owes** (liabilities), and what is left for shareholders (equity).",
                        "The three always balance: **Assets = Liabilities + Equity**."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A company has assets of ₦500 billion and liabilities of ₦380 billion. Equity is ₦500bn - ₦380bn = ₦120 billion."
                    }
                },
                {
                    "title": "Assets: current and non-current",
                    "body": [
                        "**Current assets** can become cash within a year: cash, money customers owe (receivables) and stock for sale (inventory). **Non-current assets** last longer: buildings, machinery, land and long-term investments."
                    ],
                    "bullets": [
                        "Receivables growing much faster than sales can mean customers are slow to pay.",
                        "Inventory piling up can mean products are not selling.",
                        "Intangible assets, such as goodwill, are harder to value and cannot be sold like a machine."
                    ]
                },
                {
                    "title": "Liabilities and equity",
                    "body": [
                        "**Current liabilities** are due within a year, such as supplier bills and short-term loans. **Non-current liabilities** are due later, such as long-term loans and bonds.",
                        "**Equity** is what belongs to shareholders after all liabilities are paid. Divide it by the number of shares to get **book value per share**."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Equity of ₦120 billion with 4 billion shares gives book value per share of ₦30."
                    }
                },
                {
                    "title": "Banks look different",
                    "body": [
                        "For a bank, customer deposits are liabilities, because the bank owes them back. Loans it has made are assets. Banks naturally carry far more liabilities than other firms, so a ratio that looks scary for a factory can be normal for a bank."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Looking only at profit and never at the balance sheet. A company can report profit while piling up debt and unpaid bills."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "How big is debt compared with equity?",
                        "Is there enough cash and current assets to meet bills due this year?",
                        "Are receivables or inventory growing faster than sales?",
                        "How much of the assets are intangible?",
                        "Has equity been growing, or shrinking from losses?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov: Beginners’ Guide to Financial Statements", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "bs-1", "q": "What does a balance sheet show?", "options": ["A company’s assets, liabilities and equity on one date", "Only the year’s profit", "Only the share price", "Only dividends paid"], "answer": 0, "explain": "It is a snapshot of what the company owns and owes." },
                    { "id": "bs-2", "q": "Which equation always holds?", "options": ["Assets = Equity - Liabilities", "Assets = Liabilities + Equity", "Equity = Assets + Liabilities", "Liabilities = Assets + Equity"], "answer": 1, "explain": "What a company has is funded by what it owes plus what shareholders own." },
                    { "id": "bs-3", "q": "A company has assets of ₦500 billion and liabilities of ₦380 billion. What is equity?", "options": ["₦880 billion", "₦380 billion", "₦120 billion", "₦500 billion"], "answer": 2, "explain": "₦500bn minus ₦380bn is ₦120bn." },
                    { "id": "bs-4", "q": "Which is a current asset?", "options": ["A factory building", "Cash", "Long-term investment", "Goodwill"], "answer": 1, "explain": "Cash is the most liquid current asset." },
                    { "id": "bs-5", "q": "What are receivables?", "options": ["Money the company owes suppliers", "Money customers owe the company", "Money paid as dividends", "Money from selling shares"], "answer": 1, "explain": "Receivables are unpaid customer bills, which count as an asset." },
                    { "id": "bs-6", "q": "What is a current liability?", "options": ["A debt due within about a year", "A building", "A share of profit", "A 20-year bond"], "answer": 0, "explain": "Current liabilities are due in the short term." },
                    { "id": "bs-7", "q": "Equity of ₦120 billion and 4 billion shares. What is book value per share?", "options": ["₦480", "₦3", "₦300", "₦30"], "answer": 3, "explain": "₦120bn ÷ 4bn = ₦30." },
                    { "id": "bs-8", "q": "Equity is ₦60 billion with 2 billion shares. What is book value per share?", "options": ["₦30", "₦120", "₦3", "₦0.03"], "answer": 0, "explain": "60 ÷ 2 = ₦30." },
                    { "id": "bs-9", "q": "Receivables are growing much faster than sales. What might this suggest?", "options": ["Customers may be paying slowly", "Sales are doubling", "Debt is falling", "The share price is fixed"], "answer": 0, "explain": "It can signal collection problems or aggressive selling terms." },
                    { "id": "bs-10", "q": "Inventory keeps piling up while sales are flat. What is a possible meaning?", "options": ["Customers love the product", "The company has no costs", "Products may not be selling", "Profit is guaranteed"], "answer": 2, "explain": "Unsold stock ties up money and may later be written down." },
                    { "id": "bs-11", "q": "For a bank, what are customer deposits?", "options": ["Assets", "Equity", "Revenue", "Liabilities"], "answer": 3, "explain": "The bank owes deposits back to customers." },
                    { "id": "bs-12", "q": "Why can a high liabilities-to-assets figure be normal for a bank?", "options": ["Banks do not pay tax", "Deposits are liabilities and funding loans is their business", "Banks have no equity", "Banks never borrow"], "answer": 1, "explain": "Banks are naturally more leveraged than most other firms." },
                    { "id": "bs-13", "q": "Why are intangible assets like goodwill treated with caution?", "options": ["They are always worthless", "They are cash", "They are hard to sell or value like physical assets", "They earn dividends"], "answer": 2, "explain": "Their value depends on judgement and can be written down." },
                    { "id": "bs-14", "q": "A company reports profit but its liabilities keep rising faster than its assets. What is sensible?", "options": ["Ignore the balance sheet", "Dig deeper into its debt and cash position", "Buy more at once", "Assume profit is real"], "answer": 1, "explain": "Rising leverage can hide problems that profit alone does not show." },
                    { "id": "bs-15", "q": "How does a balance sheet differ from an income statement?", "options": ["They are the same", "The balance sheet is a snapshot, the income statement covers a period", "The balance sheet covers a year, the income statement one day", "Only the income statement is audited"], "answer": 1, "explain": "One shows a point in time, the other shows performance over time." }
                ]
            }
        },

        {
            "id": "the-cash-flow-statement",
            "title": "The cash flow statement",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Profit is not cash",
                    "body": [
                        "A company can report a profit and still run out of money. Profit counts a sale when it is made, even if the customer has not paid. The **cash flow statement** tracks the actual cash moving in and out.",
                        "That is why many experienced investors read it right after the income statement."
                    ]
                },
                {
                    "title": "The three parts",
                    "bullets": [
                        "**Operating cash flow:** cash from running the business day to day. This is the key line.",
                        "**Investing cash flow:** cash spent on or received from long-term assets, such as buying machinery. Spending is normal here and often shows as a negative number.",
                        "**Financing cash flow:** cash from or to lenders and shareholders, such as new loans, loan repayments, dividends and share sales."
                    ]
                },
                {
                    "title": "Free cash flow",
                    "body": [
                        "**Free cash flow (FCF)** is operating cash flow minus the money spent on maintaining and growing the business (capital expenditure). It is the cash left over for dividends, debt repayment or growth.",
                        "A company that reports profit but has weak free cash flow year after year deserves a closer look."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Operating cash flow is ₦40 billion and capital spending is ₦25 billion. Free cash flow is ₦15 billion."
                    }
                },
                {
                    "title": "Profit against cash",
                    "body": [
                        "Compare net income with operating cash flow. Over several years they should move roughly together. If profit is high and cash is persistently low, the profit may be tied up in unpaid bills or unsold stock."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Net income ₦20 billion, operating cash flow ₦5 billion. Cash is only 25% of profit (5 ÷ 20). That gap needs explaining."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating negative investing cash flow as bad. A growing business should spend on its future. The warning sign is operating cash that is weak while borrowing pays the bills."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is operating cash flow positive and in line with profit over several years?",
                        "Does free cash flow cover the dividend?",
                        "Is the company funding itself, or borrowing to stay afloat?",
                        "Is spending on assets rising along with sales?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "cf-1", "q": "What does the cash flow statement track?", "options": ["Cash actually moving in and out of the company", "The share price", "Only dividends", "Only taxes"], "answer": 0, "explain": "It shows real cash movements, not accounting profit." },
                    { "id": "cf-2", "q": "Why can a profitable company still run out of cash?", "options": ["Profit is always cash", "Sales may not yet have been paid for", "Profit is taxed at 100%", "Dividends are illegal"], "answer": 1, "explain": "Profit records sales when made, not when the cash arrives." },
                    { "id": "cf-3", "q": "Which is the cash from running the business day to day?", "options": ["Financing cash flow", "Investing cash flow", "Operating cash flow", "Dividend yield"], "answer": 2, "explain": "Operating cash flow is the core line." },
                    { "id": "cf-4", "q": "Buying new machinery appears in which section?", "options": ["Operating", "Financing", "Revenue", "Investing"], "answer": 3, "explain": "Spending on long-term assets is investing cash flow." },
                    { "id": "cf-5", "q": "Paying a dividend appears in which section?", "options": ["Financing", "Investing", "Operating", "Revenue"], "answer": 0, "explain": "Money paid to shareholders is a financing flow." },
                    { "id": "cf-6", "q": "Taking out a new loan appears in which section?", "options": ["Operating", "Financing", "Investing", "Profit"], "answer": 1, "explain": "Borrowing and repaying are financing flows." },
                    { "id": "cf-7", "q": "How is free cash flow calculated?", "options": ["Revenue minus profit", "Net income plus dividends", "Operating cash flow minus capital spending", "Share price times shares"], "answer": 2, "explain": "It is the cash left after investing in the business." },
                    { "id": "cf-8", "q": "Operating cash flow is ₦40 billion and capital spending is ₦25 billion. What is free cash flow?", "options": ["₦65 billion", "₦25 billion", "₦40 billion", "₦15 billion"], "answer": 3, "explain": "40 minus 25 is ₦15 billion." },
                    { "id": "cf-9", "q": "Net income is ₦20 billion and operating cash flow is ₦5 billion. Cash is what share of profit?", "options": ["25%", "4%", "400%", "75%"], "answer": 0, "explain": "5 ÷ 20 = 0.25, or 25%." },
                    { "id": "cf-10", "q": "A company shows high profit and persistently low operating cash. What is sensible?", "options": ["Ignore it", "Investigate where the profit is tied up", "Buy more immediately", "Assume it is paying dividends"], "answer": 1, "explain": "The gap may hide unpaid bills or unsold stock." },
                    { "id": "cf-11", "q": "Is negative investing cash flow always bad?", "options": ["Yes, always", "Only for banks", "No, a growing company often spends on assets", "Yes, it means a loss"], "answer": 2, "explain": "Spending on the future shows up as negative investing cash flow." },
                    { "id": "cf-12", "q": "Which is a worrying pattern?", "options": ["Operating cash covering the dividend", "Positive free cash flow", "Weak operating cash, with borrowing paying the bills", "Steady capital spending"], "answer": 2, "explain": "Relying on loans to fund operations is a warning sign." },
                    { "id": "cf-13", "q": "Why check whether free cash flow covers the dividend?", "options": ["To see if the dividend is affordable", "To set the share price", "To avoid tax", "To pick a ticker"], "answer": 0, "explain": "A dividend paid from borrowing is harder to sustain." },
                    { "id": "cf-14", "q": "Why compare profit and operating cash over several years?", "options": ["One year is always enough", "Over time they should move roughly together", "Cash is irrelevant", "To predict the share price"], "answer": 1, "explain": "A lasting gap signals a quality problem." },
                    { "id": "cf-15", "q": "Which statement is true?", "options": ["Profit and cash are the same thing", "Cash flow is not audited", "Only income matters", "A company can be profitable and short of cash"], "answer": 3, "explain": "Profit and cash can diverge sharply." }
                ]
            }
        },

        {
            "id": "debt-and-financial-health",
            "title": "Debt and financial health ratios",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Why debt matters",
                    "body": [
                        "Debt is not bad in itself. It can fund growth. But lenders must be paid whatever happens, so a company with a lot of debt has less room for a bad year. High interest rates make this worse."
                    ]
                },
                {
                    "title": "Debt-to-equity and interest cover",
                    "body": [
                        "**Debt-to-equity** compares borrowing with shareholders’ money. Divide total debt by equity. Higher means more leverage.",
                        "**Interest cover** shows how easily a company pays its interest. Divide operating profit (before interest and tax) by interest. A figure near 1 means almost all operating profit goes to interest."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Debt ₦150bn, equity ₦100bn: debt-to-equity is 1.5. Operating profit ₦30bn, interest ₦12bn: interest cover is 2.5 times."
                    }
                },
                {
                    "title": "Liquidity: can it pay this year’s bills?",
                    "body": [
                        "The **current ratio** is current assets divided by current liabilities. Above 1 means short-term assets exceed short-term bills. Well below 1 can signal trouble, though some industries operate safely with low ratios."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Current assets ₦90bn and current liabilities ₦60bn give a current ratio of 1.5."
                    }
                },
                {
                    "title": "Returns: ROE and ROA",
                    "body": [
                        "**Return on equity (ROE)** is net income divided by equity. It shows how much profit the company makes on shareholders’ money. **Return on assets (ROA)** is net income divided by total assets.",
                        "High ROE is good, but check how it was achieved. A company can boost ROE just by borrowing more, which also raises risk."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Net income ₦20bn and equity ₦100bn give an ROE of 20%."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Comparing ratios across different industries. A bank, a cement maker and a telecom firm have very different normal levels. Compare a company with its peers and its own past."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is debt-to-equity rising year after year?",
                        "Can operating profit comfortably cover interest?",
                        "Is the current ratio healthy for that industry?",
                        "Is a high ROE coming from real profit, or only from borrowing?",
                        "How do these figures compare with similar companies?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "dh-1", "q": "How is debt-to-equity calculated?", "options": ["Equity divided by profit", "Debt divided by revenue", "Profit divided by debt", "Total debt divided by equity"], "answer": 3, "explain": "It compares borrowing with shareholders’ funds." },
                    { "id": "dh-2", "q": "Debt is ₦150bn and equity is ₦100bn. What is debt-to-equity?", "options": ["1.5", "0.67", "15", "250"], "answer": 0, "explain": "150 ÷ 100 = 1.5." },
                    { "id": "dh-3", "q": "What does a higher debt-to-equity ratio generally mean?", "options": ["Less leverage", "No debt", "More leverage and less room for a bad year", "Higher dividends"], "answer": 2, "explain": "More borrowing relative to equity raises financial risk." },
                    { "id": "dh-4", "q": "How is interest cover calculated?", "options": ["Operating profit divided by interest", "Interest divided by profit", "Debt divided by equity", "Revenue divided by assets"], "answer": 0, "explain": "It shows how many times profit covers the interest bill." },
                    { "id": "dh-5", "q": "Operating profit is ₦30bn and interest is ₦12bn. What is interest cover?", "options": ["0.4 times", "2.5 times", "18 times", "42 times"], "answer": 1, "explain": "30 ÷ 12 = 2.5." },
                    { "id": "dh-6", "q": "Interest cover is close to 1. What does it suggest?", "options": ["Almost all operating profit goes to interest", "Debt is zero", "The company is very safe", "Dividends are high"], "answer": 0, "explain": "There is almost no cushion left." },
                    { "id": "dh-7", "q": "How is the current ratio calculated?", "options": ["Equity divided by debt", "Net income divided by equity", "Current assets divided by current liabilities", "Revenue divided by costs"], "answer": 2, "explain": "It tests short-term bill-paying ability." },
                    { "id": "dh-8", "q": "Current assets are ₦90bn and current liabilities ₦60bn. What is the current ratio?", "options": ["0.67", "150", "30", "1.5"], "answer": 3, "explain": "90 ÷ 60 = 1.5." },
                    { "id": "dh-9", "q": "How is return on equity (ROE) calculated?", "options": ["Revenue divided by equity", "Net income divided by equity", "Debt divided by net income", "Equity divided by assets"], "answer": 1, "explain": "ROE shows profit earned on shareholders’ money." },
                    { "id": "dh-10", "q": "Net income is ₦20bn and equity is ₦100bn. What is ROE?", "options": ["5%", "50%", "200%", "20%"], "answer": 3, "explain": "20 ÷ 100 = 20%." },
                    { "id": "dh-11", "q": "How can a company raise ROE without becoming more profitable?", "options": ["By borrowing more, which also raises risk", "By cutting its ticker", "By delaying results", "It cannot"], "answer": 0, "explain": "Less equity relative to profit lifts ROE, but leverage adds risk." },
                    { "id": "dh-12", "q": "Why not compare a bank’s debt ratios with a cement maker’s?", "options": ["They are identical", "Industries have very different normal levels", "Banks have no debt", "Cement makers have no assets"], "answer": 1, "explain": "Compare like with like." },
                    { "id": "dh-13", "q": "Net income is ₦15bn and total assets ₦300bn. What is ROA?", "options": ["20%", "0.5%", "5%", "50%"], "answer": 2, "explain": "15 ÷ 300 = 5%." },
                    { "id": "dh-14", "q": "Which combination is most worrying?", "options": ["Low debt and high interest cover", "Rising debt-to-equity and falling interest cover", "Positive free cash flow and low debt", "Steady ROE"], "answer": 1, "explain": "More debt with less ability to pay interest is a risky mix." },
                    { "id": "dh-15", "q": "Is debt always bad?", "options": ["Yes, always", "Yes, for any company", "No, it can fund growth, but it must be repaid whatever happens", "No, it is free money"], "answer": 2, "explain": "Debt helps when manageable and hurts when it is not." }
                ]
            }
        },

        {
            "id": "analysing-a-company-case-study",
            "title": "Case study: reading a company from start to finish",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "Meet “Company X” (made up)",
                    "body": [
                        "Use a fixed routine on every company: income statement, cash flow, balance sheet, then peers and notes. Here are the numbers for a made-up company, in ₦ billions."
                    ],
                    "bullets": [
                        "Revenue: 200 (up 8% on last year)",
                        "Operating profit: 30. Interest: 12. Net income: 20",
                        "Operating cash flow: 5. Capital spending: 10",
                        "Total debt: 150. Equity: 100",
                        "Current assets: 70. Current liabilities: 90"
                    ]
                },
                {
                    "title": "Step 1: the income statement",
                    "body": [
                        "Profit margin is 20 ÷ 200 = 10%. Revenue is growing 8%. On the surface this looks healthy. A beginner might stop here."
                    ]
                },
                {
                    "title": "Step 2: the cash flow statement",
                    "body": [
                        "Operating cash flow is only ₦5bn against net income of ₦20bn, so cash is 25% of profit. Free cash flow is 5 - 10 = -₦5bn. The business is not generating the cash its profit suggests."
                    ]
                },
                {
                    "title": "Step 3: the balance sheet and ratios",
                    "body": [
                        "Debt-to-equity is 1.5. Interest cover is 30 ÷ 12 = 2.5 times. The current ratio is 70 ÷ 90 = 0.78, so short-term bills exceed short-term assets. ROE is 20%, but it is boosted by borrowing."
                    ]
                },
                {
                    "title": "The verdict",
                    "body": [
                        "The income statement looked fine, yet cash is weak, debt is heavy, and short-term bills are not covered. Company X is **risky**, whatever its profit says. It might still be a reasonable investment at a very low price, but only if you understand and accept those risks.",
                        "Finish with the parts people skip: compare with peers, read the notes and the **auditor’s report**, and look for related-party dealings or repeated restatements."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Stopping at revenue and profit growth. Most nasty surprises appear in cash flow and the balance sheet."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Profit against operating cash over several years.",
                        "Debt, interest cover and short-term liquidity.",
                        "Whether ROE is driven by borrowing.",
                        "Peers: is this normal for the industry?",
                        "The auditor’s report and notes for warnings."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "cs-1", "q": "Company X has revenue of ₦200bn and net income of ₦20bn. What is its profit margin?", "options": ["10%", "1%", "20%", "100%"], "answer": 0, "explain": "20 ÷ 200 = 10%." },
                    { "id": "cs-2", "q": "Company X’s operating cash flow is ₦5bn against net income of ₦20bn. What does that show?", "options": ["Cash is strong", "Cash is only a small part of reported profit", "Profit is negative", "Debt is zero"], "answer": 1, "explain": "The cash is just 25% of profit, which needs explaining." },
                    { "id": "cs-3", "q": "Operating cash flow ₦5bn and capital spending ₦10bn. What is free cash flow?", "options": ["₦15bn", "₦5bn", "-₦5bn", "₦10bn"], "answer": 2, "explain": "5 minus 10 is -₦5bn." },
                    { "id": "cs-4", "q": "Debt is ₦150bn and equity ₦100bn. What is debt-to-equity?", "options": ["0.67", "1.5", "15", "2.5"], "answer": 1, "explain": "150 ÷ 100 = 1.5." },
                    { "id": "cs-5", "q": "Operating profit ₦30bn and interest ₦12bn. What is interest cover?", "options": ["12 times", "0.4 times", "18 times", "2.5 times"], "answer": 3, "explain": "30 ÷ 12 = 2.5." },
                    { "id": "cs-6", "q": "Current assets ₦70bn and current liabilities ₦90bn. What is the current ratio, roughly?", "options": ["0.78", "1.29", "20", "7"], "answer": 0, "explain": "70 ÷ 90 is about 0.78." },
                    { "id": "cs-7", "q": "What does a current ratio below 1 mean?", "options": ["No debt", "Short-term bills exceed short-term assets", "High profit", "Guaranteed growth"], "answer": 1, "explain": "The company may struggle to pay near-term bills from current assets." },
                    { "id": "cs-8", "q": "Why is Company X’s 20% ROE less impressive than it looks?", "options": ["It is negative", "It is lower than the margin", "It is boosted by borrowing", "ROE is always meaningless"], "answer": 2, "explain": "Heavy debt shrinks equity and lifts ROE while adding risk." },
                    { "id": "cs-9", "q": "In what order does the routine suggest reading the statements?", "options": ["Balance sheet only", "Auditor’s report only", "Share price only", "Income statement, cash flow, balance sheet, then peers and notes"], "answer": 3, "explain": "Work through each statement, then compare and read the notes." },
                    { "id": "cs-10", "q": "A beginner stops after seeing revenue and profit growth. What may they miss?", "options": ["Cash and balance sheet warnings", "The ticker", "The company’s name", "Nothing"], "answer": 0, "explain": "Weak cash and heavy debt do not show in the income statement." },
                    { "id": "cs-11", "q": "Why read the auditor’s report?", "options": ["It sets the share price", "It guarantees profit", "It can flag concerns about the accounts", "It lists dividends"], "answer": 2, "explain": "Qualified opinions or warnings are serious signs." },
                    { "id": "cs-12", "q": "Which is a red flag in the notes?", "options": ["Clear explanations", "Large dealings with related parties that are poorly explained", "Stable margins", "An audit by a known firm"], "answer": 1, "explain": "Unclear related-party deals can hide problems." },
                    { "id": "cs-13", "q": "Why compare Company X with its peers?", "options": ["To see whether its ratios are normal for the industry", "To copy their share price", "To avoid tax", "Peers do not matter"], "answer": 0, "explain": "Context tells you what is high or low." },
                    { "id": "cs-14", "q": "Which sentence is the most accurate verdict on Company X?", "options": ["Safe, profit is growing", "Risky: weak cash, heavy debt and thin short-term cover", "A sure bargain", "Debt-free"], "answer": 1, "explain": "Profit looks fine, but cash and balance-sheet strength are poor." },
                    { "id": "cs-15", "q": "Could Company X still be worth owning?", "options": ["Never", "Only if you ignore the numbers", "Always", "Possibly, if the price is low enough and you understand and accept the risks"], "answer": 3, "explain": "Risky is not the same as worthless, but price and understanding matter." }
                ]
            }
        }
    ]
},

/* ============================================
   CORPORATE ACTIONS: drop-in track
   Put this object right after "reading-financial-statements".
   2 lessons, 15 questions each (5 asked per try).
   Check the date names in real notices: Nigerian announcements
   often say "qualification date" and "closure date".
   ============================================ */
{
    "id": "corporate-actions",
    "title": "Corporate Actions",
    "summary": "Bonus shares, rights issues, buybacks and your rights.",
    "level": "Intermediate",
    "theme": "amber",
    "icon": "fa-file-signature",
    "lessons": [
        {
            "id": "bonus-splits-and-rights",
            "title": "Bonus issues, splits and rights issues",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "What is a corporate action?",
                    "body": [
                        "A **corporate action** is a decision by a company that changes its shares or what shareholders receive. Dividends are one. Bonus issues, splits and rights issues are others.",
                        "They matter because they can change how many shares you hold, the price per share, or whether you must pay more money to keep your stake."
                    ]
                },
                {
                    "title": "Bonus issues",
                    "body": [
                        "In a **bonus issue** (or scrip issue), the company gives existing shareholders extra shares for free, in a set ratio. A “1 for 5” bonus means 1 new share for every 5 you hold.",
                        "It is not free money. The company is worth the same, there are just more shares, so the price adjusts down."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You own 1,000 shares at ₦50 (₦50,000). A 1-for-5 bonus gives you 200 more, so 1,200 shares. The price adjusts to about ₦41.67 (50,000 ÷ 1,200). Your holding is still worth about ₦50,000."
                    }
                },
                {
                    "title": "Stock splits",
                    "body": [
                        "A **stock split** divides each share into several. In a 2-for-1 split you get two shares for each one, and the price halves. A **reverse split** does the opposite and combines shares, which raises the price.",
                        "Splits change the number and price of shares, not the value of the company or your stake."
                    ]
                },
                {
                    "title": "Rights issues and dilution",
                    "body": [
                        "A **rights issue** offers existing shareholders the right to buy new shares, usually at a discount, in proportion to what they hold. The company raises money. You can take up your rights, sell them if they are tradable, or let them lapse.",
                        "If you do nothing, your ownership share shrinks. This is **dilution**, because the same company is now split into more shares."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A 1-for-4 rights issue at ₦40 when the price is ₦50. You own 400 shares, so you can buy 100 new ones for ₦4,000. The theoretical price after the issue is (4 × ₦50 + 1 × ₦40) ÷ 5 = ₦48."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Celebrating a bonus issue as “free shares”, or ignoring a rights offer. Free shares come with a lower price, and an ignored rights issue can cost you value."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "The ratio, the price and the key dates in the official notice.",
                        "Why the company wants the money, and what it will do with it.",
                        "Whether to take up, sell or let lapse any rights.",
                        "How the price adjusts, so a drop is not mistaken for a loss.",
                        "Whether the issue is needed to fix a weak balance sheet."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "ca-1", "q": "What is a corporate action?", "options": ["A company decision that changes its shares or what shareholders receive", "A broker’s fee", "A daily price move", "A tax on gains"], "answer": 0, "explain": "Dividends, bonus issues, splits and rights issues are all corporate actions." },
                    { "id": "ca-2", "q": "What is a bonus issue?", "options": ["Cash paid to staff", "Extra shares given free to existing shareholders in a set ratio", "A fee refunded by the broker", "A new type of dividend tax"], "answer": 1, "explain": "Existing holders receive additional shares at no charge." },
                    { "id": "ca-3", "q": "You own 1,000 shares. A 1-for-5 bonus gives you how many new shares?", "options": ["100", "500", "200", "1,000"], "answer": 2, "explain": "1,000 ÷ 5 = 200 new shares." },
                    { "id": "ca-4", "q": "After the 1-for-5 bonus you own 1,200 shares. Roughly what happens to the price, other things equal?", "options": ["It rises 20%", "It adjusts down, to about 83% of its old level", "It stays exactly the same", "It doubles"], "answer": 1, "explain": "More shares for the same company value means each is worth less." },
                    { "id": "ca-5", "q": "1,000 shares at ₦50, then a 1-for-5 bonus. What is your holding worth afterwards, roughly?", "options": ["About ₦60,000", "About ₦41,670", "About ₦50,000", "About ₦10,000"], "answer": 2, "explain": "1,200 × ₦41.67 is about ₦50,000, so the value is unchanged." },
                    { "id": "ca-6", "q": "What happens in a 2-for-1 stock split?", "options": ["Each share becomes two, and the price roughly halves", "The company doubles in value", "Shares are cancelled", "The price doubles"], "answer": 0, "explain": "The number of shares doubles and the price per share halves." },
                    { "id": "ca-7", "q": "Does a stock split change the value of your stake?", "options": ["Yes, it doubles it", "Yes, it halves it", "No, it changes the number and price of shares only", "It cancels it"], "answer": 2, "explain": "Total value stays the same." },
                    { "id": "ca-8", "q": "What does a reverse split do?", "options": ["Cuts the dividend", "Combines shares, which raises the price per share", "Splits shares further", "Cancels the listing"], "answer": 1, "explain": "Fewer shares at a higher price, with the same total value." },
                    { "id": "ca-9", "q": "What is a rights issue?", "options": ["A free gift of shares", "A refund of fees", "A dividend paid in shares", "An offer to existing shareholders to buy new shares, often at a discount"], "answer": 3, "explain": "Shareholders get the right, not the obligation, to buy more." },
                    { "id": "ca-10", "q": "You own 400 shares and there is a 1-for-4 rights issue. How many new shares can you buy?", "options": ["100", "1,600", "4", "400"], "answer": 0, "explain": "400 ÷ 4 = 100." },
                    { "id": "ca-11", "q": "Those 100 new shares cost ₦40 each. How much do you pay to take them all up?", "options": ["₦400", "₦40,000", "₦4,000", "₦100"], "answer": 2, "explain": "100 × ₦40 = ₦4,000." },
                    { "id": "ca-12", "q": "What happens to your percentage ownership if you ignore a rights issue and others take up theirs?", "options": ["It rises", "It stays the same", "It doubles", "It shrinks (dilution)"], "answer": 3, "explain": "More shares exist, so your slice of the company is smaller." },
                    { "id": "ca-13", "q": "In a 1-for-4 rights issue at ₦40 with the price at ₦50, what is the theoretical price afterwards?", "options": ["₦48", "₦50", "₦40", "₦45"], "answer": 0, "explain": "(4 × 50 + 1 × 40) ÷ 5 = 240 ÷ 5 = ₦48." },
                    { "id": "ca-14", "q": "Why might a price drop after a bonus issue not be a real loss?", "options": ["Prices never fall", "Because shares are cancelled", "The price adjusts for the extra shares while total value stays about the same", "Because dividends are doubled"], "answer": 2, "explain": "You hold more shares at a lower price." },
                    { "id": "ca-15", "q": "Which is a sensible first step on receiving a rights offer?", "options": ["Ignore it", "Read the notice for the ratio, price and deadlines", "Sell everything", "Share your account details with a caller"], "answer": 1, "explain": "Deadlines matter, and rights that lapse can lose you value." }
                ]
            }
        },

        {
            "id": "buybacks-mergers-and-shareholder-rights",
            "title": "Buybacks, mergers and your shareholder rights",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Share buybacks",
                    "body": [
                        "In a **buyback**, a company buys its own shares from the market. Fewer shares exist, so each remaining share owns a bigger slice of the profits. Earnings per share (EPS) rises even if profit does not."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Net income ₦1bn and 100 million shares give EPS of ₦10. The company buys back 10 million shares. With 90 million left, EPS is about ₦11.11, with no extra profit."
                    }
                },
                {
                    "title": "Judging a buyback",
                    "body": [
                        "A buyback can be a good use of spare cash, especially when the shares are cheap. It is less convincing when the company borrows to do it, pays a high price, or uses it to hide weak growth."
                    ]
                },
                {
                    "title": "Mergers and takeovers",
                    "body": [
                        "In a **merger** two companies combine. In a **takeover** one buys another. The target’s share price often jumps toward the offer price, because buyers expect to be paid.",
                        "Read the terms. Offers may be cash, shares or both, and they can fail or change. Large capital raises, such as the bank recapitalisations regulators have required, can also bring rights issues and public offers."
                    ]
                },
                {
                    "title": "Your rights as a shareholder",
                    "body": [
                        "Owning shares gives you rights: to receive dividends when declared, to attend and vote at the **Annual General Meeting (AGM)**, to receive the annual report, and to be treated fairly.",
                        "Dividend notices show the key dates. In Nigeria they often appear as a **qualification date** (when you must be on the register), a **closure date** and a **payment date**. Read each notice, because the wording differs between companies."
                    ]
                },
                {
                    "title": "Unclaimed dividends",
                    "body": [
                        "Many Nigerian investors leave dividends unclaimed because their details are out of date. Your shares are recorded with a **registrar**. Keep your name, address, phone, bank account and e-dividend mandate current with the registrar, so payments reach you."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating a buyback as a guaranteed boost. A company can buy back at a bad price, or spend cash it needs elsewhere."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is the buyback funded from spare cash, or from borrowing?",
                        "Is EPS growth coming from profit or only from fewer shares?",
                        "What are the exact terms and deadlines of an offer?",
                        "Are my registrar details and bank mandate up to date?",
                        "What did the AGM notice and annual report say?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "bm-1", "q": "What is a share buyback?", "options": ["A company buys its own shares from the market", "A broker buys shares for you", "A dividend paid in cash", "A new share offering"], "answer": 0, "explain": "The company reduces the number of shares in circulation." },
                    { "id": "bm-2", "q": "What does a buyback usually do to the number of shares in issue?", "options": ["Raises it", "Reduces it", "Leaves it unchanged", "Doubles it"], "answer": 1, "explain": "Bought-back shares are removed from the market." },
                    { "id": "bm-3", "q": "Net income ₦1bn and 100 million shares. What is EPS?", "options": ["₦1", "₦100", "₦10", "₦0.10"], "answer": 2, "explain": "₦1bn ÷ 100m = ₦10." },
                    { "id": "bm-4", "q": "After buying back 10 million of those shares, what is EPS roughly, with the same profit?", "options": ["₦9", "₦10", "₦11.11", "₦20"], "answer": 2, "explain": "₦1bn ÷ 90m is about ₦11.11." },
                    { "id": "bm-5", "q": "Why can a buyback raise EPS?", "options": ["Profit always doubles", "Dividends are cancelled", "The price is fixed", "The same profit is shared across fewer shares"], "answer": 3, "explain": "EPS is profit divided by the number of shares." },
                    { "id": "bm-6", "q": "When is a buyback less convincing?", "options": ["When funded by spare cash", "When shares are cheap", "When the company borrows to do it or pays too high a price", "When profit is growing"], "answer": 2, "explain": "The funding and price matter." },
                    { "id": "bm-7", "q": "What happens to a target company’s share price after a takeover offer?", "options": ["It usually moves toward the offer price", "It always falls", "It becomes zero", "It is frozen forever"], "answer": 0, "explain": "Buyers expect to be paid something close to the offer." },
                    { "id": "bm-8", "q": "Why read the terms of a takeover offer?", "options": ["Terms never differ", "It may be cash, shares or both, and can change or fail", "It sets the broker’s fee", "Offers always succeed"], "answer": 1, "explain": "The form of payment and conditions affect your outcome." },
                    { "id": "bm-9", "q": "What is the AGM?", "options": ["A daily price report", "A type of order", "A bank loan", "The yearly meeting where shareholders can vote and ask questions"], "answer": 3, "explain": "AGM stands for Annual General Meeting." },
                    { "id": "bm-10", "q": "What does the qualification date in a dividend notice tell you?", "options": ["When the dividend is paid", "The day you must be on the register to qualify", "The day of the AGM", "The company’s birthday"], "answer": 1, "explain": "It is the cut-off for who is entitled to the dividend." },
                    { "id": "bm-11", "q": "What is a registrar?", "options": ["A broker", "A tax officer", "The firm that keeps the company’s register of shareholders", "A stock exchange"], "answer": 2, "explain": "Registrars hold shareholder records and handle dividend payments." },
                    { "id": "bm-12", "q": "Why do dividends often go unclaimed?", "options": ["Investors’ contact or bank details are outdated", "Dividends are always cancelled", "They are paid in kind", "The exchange keeps them"], "answer": 0, "explain": "Payments fail when details on the register are wrong." },
                    { "id": "bm-13", "q": "What should you keep up to date with the registrar?", "options": ["Your favourite stock", "Your share price target", "Name, address, phone, bank details and e-dividend mandate", "Your broker’s logo"], "answer": 2, "explain": "Accurate details make sure payments reach you." },
                    { "id": "bm-14", "q": "Which is a right of a shareholder?", "options": ["A guaranteed profit", "Veto over every trade", "Free shares each year", "The right to vote at the AGM"], "answer": 3, "explain": "Voting and receiving declared dividends are standard rights." },
                    { "id": "bm-15", "q": "EPS rose after a buyback with no extra profit. What is sensible?", "options": ["Assume the business grew", "Ask whether growth came from profit or only fewer shares", "Buy immediately", "Ignore EPS forever"], "answer": 1, "explain": "A buyback can lift EPS without any improvement in the business." }
                ]
            }
        }
    ]
},


        /* ============================================
   RISK AND DIVERSIFICATION: drop-in track

   In learn-content.js, find the track with
   "id": "risk-and-diversification" and replace that whole
   { ... } object with the one below.
   Lessons: 4, each with 5 sections and 15 questions.
   ============================================ */

{
    "id": "risk-and-diversification",
    "title": "Risk and Diversification",
    "summary": "Protect your money and spread your bets.",
    "level": "Intermediate",
    "theme": "mauve",
    "icon": "fa-shield-halved",
    "lessons": [
        {
            "id": "understanding-risk",
            "title": "Understanding investment risk",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Risk means uncertainty",
                    "body": [
                        "**Risk** is the chance that an investment’s result will differ from what you expected. Most people think of losing money, but risk also includes earning less than hoped.",
                        "Risk and reward travel together. An investment that offers a higher possible return usually carries a higher chance of a poor outcome. A savings account is steadier but earns less. Shares can earn more but their value moves around.",
                        "Your job as an investor is not to avoid risk. It is to take risks you understand, and to be paid fairly for them."
                    ]
                },
                {
                    "title": "The main types of risk",
                    "body": [
                        "Different risks hit in different ways. Knowing which one you face tells you what can reduce it."
                    ],
                    "bullets": [
                        "**Market risk:** the whole market falls and most stocks fall with it. Diversifying does not remove it.",
                        "**Company-specific risk:** something goes wrong at one business, such as fraud or a failed product. Diversifying reduces it.",
                        "**Liquidity risk:** you cannot sell quickly at a fair price because few people are trading the stock.",
                        "**Credit risk:** a borrower, such as a bond issuer, fails to pay what it owes.",
                        "**Inflation risk:** rising prices erode what your money can buy.",
                        "**Currency risk:** a move in the exchange rate changes the value of foreign holdings in naira."
                    ]
                },
                {
                    "title": "Volatility",
                    "body": [
                        "**Volatility** measures how much and how fast a price moves. A volatile stock swings widely. A calm one drifts.",
                        "Volatility is not the same as loss. A price can swing and recover. But large swings are harder to live with, and they raise the chance you will sell at a bad moment."
                    ],
                    "example": {
                        "label": "Compare two stocks",
                        "text": "Over a month, Stock A moves between ₦98 and ₦102. Stock B moves between ₦70 and ₦130. Both may end near ₦100, but B is far more volatile."
                    }
                },
                {
                    "title": "Drawdown and the maths of recovery",
                    "body": [
                        "A **drawdown** is the fall from a peak to a later low. It shows how bad the pain got.",
                        "Losses are harder to recover than they look. A fall needs a bigger rise to get back to where you started."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A portfolio falls from ₦1,000,000 to ₦600,000. That is a 40% drawdown. To get back to ₦1,000,000 it must now gain about 67% (400,000 ÷ 600,000). A 50% fall needs a 100% gain."
                    }
                },
                {
                    "title": "Know your limits",
                    "body": [
                        "Three ideas shape how much risk suits you."
                    ],
                    "bullets": [
                        "**Tolerance:** how much a fall bothers you emotionally.",
                        "**Capacity:** how much loss your finances can absorb without hurting your life.",
                        "**Time horizon:** how long before you need the money. More time gives more room to recover.",
                        "Money you need within months, such as school fees or rent, does not belong in volatile assets."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ur-1",
                        "q": "What is investment risk?",
                        "options": ["Only the chance of losing everything", "The chance an outcome differs from what you expected", "The fee a broker charges", "The size of a company"],
                        "answer": 1,
                        "explain": "Risk is uncertainty about the result. It includes earning less than hoped as well as losing money."
                    },
                    {
                        "id": "ur-2",
                        "q": "How are risk and potential return usually related?",
                        "options": ["Higher potential return usually comes with higher risk", "Higher return always means lower risk", "They have no link", "Lower risk always gives higher return"],
                        "answer": 0,
                        "explain": "Investors expect to be paid more for taking more risk."
                    },
                    {
                        "id": "ur-3",
                        "q": "What is market risk?",
                        "options": ["A single company failing", "The risk a broker is not licensed", "The risk of not being able to sell", "Broad market falls that hit most stocks together"],
                        "answer": 3,
                        "explain": "Market risk comes from the whole market moving down, and diversifying cannot remove it."
                    },
                    {
                        "id": "ur-4",
                        "q": "Which risk can diversification reduce the most?",
                        "options": ["Market risk", "Company-specific risk", "Inflation in the whole economy", "A market-wide crash"],
                        "answer": 1,
                        "explain": "Spreading money across many companies reduces the damage from any one of them failing."
                    },
                    {
                        "id": "ur-5",
                        "q": "What is liquidity risk?",
                        "options": ["Not being able to sell quickly at a fair price", "A company paying a dividend", "A borrower paying late", "The price of oil changing"],
                        "answer": 0,
                        "explain": "Thinly traded stocks can be hard to sell without accepting a worse price."
                    },
                    {
                        "id": "ur-6",
                        "q": "What is credit risk?",
                        "options": ["The risk of a falling share price", "The risk of a high broker fee", "The risk that a borrower fails to pay what it owes", "The risk of a stock split"],
                        "answer": 2,
                        "explain": "Credit risk matters most for bonds and other debt."
                    },
                    {
                        "id": "ur-7",
                        "q": "What does inflation risk mean for your savings?",
                        "options": ["The exchange rate rises", "Your money can buy less over time", "The broker loses your shares", "Your dividend is taxed"],
                        "answer": 1,
                        "explain": "When prices rise, each naira buys less, so returns must beat inflation to grow your buying power."
                    },
                    {
                        "id": "ur-8",
                        "q": "You hold a US share. The dollar weakens against the naira. Other things equal, what happens to its value in naira?",
                        "options": ["It rises", "It stays the same", "It falls", "It doubles"],
                        "answer": 2,
                        "explain": "Each dollar is worth fewer naira, so the holding is worth fewer naira."
                    },
                    {
                        "id": "ur-9",
                        "q": "What does volatility measure?",
                        "options": ["The company’s profit", "The number of shares traded", "The dividend paid", "How much and how fast a price moves"],
                        "answer": 3,
                        "explain": "Volatility is the size and speed of price swings."
                    },
                    {
                        "id": "ur-10",
                        "q": "Stock A moves between ₦98 and ₦102. Stock B moves between ₦70 and ₦130. Which is more volatile?",
                        "options": ["Stock A", "Stock B", "They are equal", "Neither moves"],
                        "answer": 1,
                        "explain": "B’s range is far wider, so it is more volatile."
                    },
                    {
                        "id": "ur-11",
                        "q": "What is a drawdown?",
                        "options": ["The fall from a peak to a later low", "A dividend payment", "A type of order", "The first day of trading"],
                        "answer": 0,
                        "explain": "A drawdown measures how far a portfolio fell from its high point."
                    },
                    {
                        "id": "ur-12",
                        "q": "A portfolio falls from ₦1,000,000 to ₦800,000. What is the drawdown?",
                        "options": ["8%", "80%", "25%", "20%"],
                        "answer": 3,
                        "explain": "The fall is ₦200,000. 200,000 ÷ 1,000,000 = 20%."
                    },
                    {
                        "id": "ur-13",
                        "q": "A portfolio falls 50%. What gain is needed to get back to the starting value?",
                        "options": ["50%", "75%", "100%", "25%"],
                        "answer": 2,
                        "explain": "₦100 becomes ₦50. To return to ₦100 it must double, a 100% gain."
                    },
                    {
                        "id": "ur-14",
                        "q": "A portfolio falls from ₦1,000,000 to ₦600,000. What is the drawdown?",
                        "options": ["60%", "40%", "67%", "4%"],
                        "answer": 1,
                        "explain": "The fall is ₦400,000, which is 40% of ₦1,000,000."
                    },
                    {
                        "id": "ur-15",
                        "q": "You need money for school fees in 6 months. Which approach fits best?",
                        "options": ["Put it all in one volatile stock", "Borrow more to invest", "Keep it in low-risk, easy-access options", "Wait for the market to double"],
                        "answer": 2,
                        "explain": "With little time to recover from a fall, money needed soon should avoid volatile assets."
                    }
                ]
            }
        },

        {
            "id": "diversification-and-correlation",
            "title": "Diversification and correlation",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Not all eggs in one basket",
                    "body": [
                        "**Diversification** means spreading your money across different investments so that no single one can badly hurt you.",
                        "If one company fails, a diversified portfolio loses a small slice. A concentrated one loses a lot."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You have ₦1,000,000. If you put it all in one stock and it falls 50%, you lose ₦500,000. If you spread it as ₦100,000 in each of 10 stocks and one falls 50%, you lose ₦50,000, which is 5% of the portfolio."
                    }
                },
                {
                    "title": "Correlation: do they move together?",
                    "body": [
                        "**Correlation** measures how closely two investments move together. It runs from +1 to -1.",
                        "Diversification works best when the pieces are not strongly correlated, because one can hold steady while another falls."
                    ],
                    "bullets": [
                        "+1: they move together almost perfectly.",
                        "0: little or no relationship.",
                        "-1: they move in opposite directions.",
                        "Five banks are all affected by interest rates and the economy, so they tend to rise and fall together."
                    ]
                },
                {
                    "title": "Ways to diversify",
                    "body": [
                        "You can spread risk in several directions at once."
                    ],
                    "bullets": [
                        "**Across companies:** own several, not one.",
                        "**Across sectors:** banks, telecoms, consumer goods, industrials.",
                        "**Across asset classes:** shares, bonds, cash and property.",
                        "**Across markets and currencies:** holding both NGX and US stocks.",
                        "**Across time:** investing regularly instead of all at once.",
                        "A fund or ETF can give you many holdings in one purchase."
                    ]
                },
                {
                    "title": "What diversification cannot do",
                    "body": [
                        "Diversification reduces company-specific risk. It cannot remove **market risk**. In a severe crash, correlations often rise and many assets fall together, so protection is weaker than it looks in calm times.",
                        "It also has a limit on the other side. Owning too many holdings makes them hard to follow, and the extra ones add little. The goal is a sensible spread, not the longest list."
                    ]
                },
                {
                    "title": "Concentration: the other side",
                    "body": [
                        "**Concentration** is having a large share of your portfolio in one stock, sector or theme. It can raise gains if you are right. It raises the damage if you are wrong.",
                        "Many investors set a cap for any single stock and a limit for any one sector. The exact numbers are personal, but having a rule matters more than the number itself."
                    ],
                    "bullets": [
                        "Check which sectors your holdings sit in.",
                        "Remember that holdings in the same sector are linked.",
                        "Add new positions to spread risk, not only to chase returns."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "dv-1",
                        "q": "What is diversification?",
                        "options": ["Spreading money across different investments", "Buying only the cheapest stock", "Selling everything at once", "Trading every day"],
                        "answer": 0,
                        "explain": "Diversification spreads risk so no single investment can do too much damage."
                    },
                    {
                        "id": "dv-2",
                        "q": "Which risk does diversification reduce most effectively?",
                        "options": ["Market-wide crashes", "Risk tied to one particular company", "Inflation", "Tax changes"],
                        "answer": 1,
                        "explain": "Company-specific risk shrinks when no single company dominates the portfolio."
                    },
                    {
                        "id": "dv-3",
                        "q": "Can diversification remove market risk completely?",
                        "options": ["Yes, always", "Yes, if you own ten stocks", "Only on the NGX", "No, a market-wide fall still affects a diversified portfolio"],
                        "answer": 3,
                        "explain": "When the whole market falls, most holdings fall with it."
                    },
                    {
                        "id": "dv-4",
                        "q": "You have ₦1,000,000 spread as ₦100,000 in each of 10 stocks. One falls 50%. What is the loss?",
                        "options": ["₦500,000", "₦100,000", "₦50,000", "₦5,000"],
                        "answer": 2,
                        "explain": "50% of ₦100,000 is ₦50,000, which is 5% of the portfolio."
                    },
                    {
                        "id": "dv-5",
                        "q": "A correlation of +1 means two investments…",
                        "options": ["Move together almost perfectly", "Move in opposite directions", "Have no relationship", "Always lose money"],
                        "answer": 0,
                        "explain": "+1 is perfect positive correlation."
                    },
                    {
                        "id": "dv-6",
                        "q": "A correlation of -1 means two investments…",
                        "options": ["Move together", "Move in opposite directions", "Are unrelated", "Have the same price"],
                        "answer": 1,
                        "explain": "-1 means one tends to rise when the other falls."
                    },
                    {
                        "id": "dv-7",
                        "q": "A correlation near 0 means…",
                        "options": ["Both are worthless", "They always move together", "There is little relationship between them", "They move in opposite directions"],
                        "answer": 2,
                        "explain": "Near 0, one tells you little about the other."
                    },
                    {
                        "id": "dv-8",
                        "q": "Diversification helps most when the holdings are…",
                        "options": ["Highly correlated", "Identical", "All in one sector", "Not strongly correlated"],
                        "answer": 3,
                        "explain": "Holdings that do not move in lockstep smooth out the overall ride."
                    },
                    {
                        "id": "dv-9",
                        "q": "You own five Nigerian bank stocks. How diversified are you?",
                        "options": ["Not fully, because they are in one sector and tend to move together", "Fully diversified", "Diversified across asset classes", "Immune to market risk"],
                        "answer": 0,
                        "explain": "Companies in the same sector often react to the same events."
                    },
                    {
                        "id": "dv-10",
                        "q": "Which is an example of diversifying across asset classes?",
                        "options": ["Buying a second bank stock", "Adding bonds to a portfolio of shares", "Buying the same stock twice", "Switching brokers"],
                        "answer": 1,
                        "explain": "Shares, bonds, cash and property are different asset classes."
                    },
                    {
                        "id": "dv-11",
                        "q": "What does holding both NGX and US stocks add?",
                        "options": ["Guaranteed profit", "No change at all", "Diversification across markets and currencies", "Lower broker fees"],
                        "answer": 2,
                        "explain": "The two markets and currencies do not always move together."
                    },
                    {
                        "id": "dv-12",
                        "q": "What is a downside of over-diversifying?",
                        "options": ["Holdings become too many to follow, and extra ones add little", "It increases company risk", "It makes losses larger", "It is illegal"],
                        "answer": 0,
                        "explain": "Beyond a point, more holdings add effort without much extra protection."
                    },
                    {
                        "id": "dv-13",
                        "q": "How can a fund or ETF help with diversification?",
                        "options": ["It removes all risk", "It guarantees returns", "It holds many securities in one purchase", "It sets the share price"],
                        "answer": 2,
                        "explain": "One purchase gives you a share of many underlying holdings."
                    },
                    {
                        "id": "dv-14",
                        "q": "In a severe market crash, what often happens to correlations?",
                        "options": ["They fall to zero", "They often rise, so many assets fall together", "They become -1", "Nothing ever changes"],
                        "answer": 1,
                        "explain": "In a panic, many assets fall together, so diversification helps less than in calm times."
                    },
                    {
                        "id": "dv-15",
                        "q": "What is concentration risk?",
                        "options": ["Paying high fees", "Holding too many stocks", "Too much of a portfolio depending on one investment or sector", "A stock’s price rising"],
                        "answer": 2,
                        "explain": "If one holding or sector dominates, a bad outcome there hurts the whole portfolio."
                    }
                ]
            }
        },

        {
            "id": "position-sizing-and-stops",
            "title": "Position sizing and limiting losses",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "How much in each stock?",
                    "body": [
                        "**Position sizing** means deciding how much money to put into each investment. It controls how much any one mistake can cost you.",
                        "A simple rule is a cap on any single stock as a share of your portfolio. The cap is personal, but a rule beats guessing."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Your portfolio is ₦2,000,000 and you cap any stock at 10%. The most you put into one stock is ₦200,000."
                    }
                },
                {
                    "title": "Sizing by the loss you accept",
                    "body": [
                        "A more careful method starts with how much you are willing to lose, then works out the size. Many people risk only a small percentage of the portfolio on one idea, such as 1%.",
                        "Steps: pick your risk amount, decide your exit price, find the loss per share, then divide."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Portfolio ₦2,000,000. Risk 1% = ₦20,000. You buy at ₦100 and will exit at ₦90, a loss of ₦10 per share. ₦20,000 ÷ ₦10 = 2,000 shares, which is a ₦200,000 position."
                    }
                },
                {
                    "title": "Stop-losses",
                    "body": [
                        "A **stop-loss** is a rule or order to sell if the price falls to a set level. It limits a loss and takes emotion out of the decision.",
                        "It is not perfect. A price can gap past your level, so you sell lower than planned. On thinly traded stocks you may not find a buyer at your price, and some exchanges limit how far a price can move in a day. A stop-loss reduces risk. It does not remove it."
                    ]
                },
                {
                    "title": "Risk and reward together",
                    "body": [
                        "The **risk-reward ratio** compares what you could lose with what you hope to gain. Aim for trades where the possible gain clearly exceeds the possible loss.",
                        "A good ratio lets you be wrong often and still do fine. It does not make a trade win."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Buy at ₦100, exit at ₦90 if wrong, target ₦130 if right. Risk ₦10, reward ₦30, a 3:1 ratio. At 2:1, you break even (before costs) if you are right about one trade in three."
                    }
                },
                {
                    "title": "Leverage magnifies everything",
                    "body": [
                        "**Leverage** means using borrowed money to hold more than you could afford. **Margin** is the collateral you put up for it.",
                        "It magnifies gains and losses equally, and the lender wants repayment whatever happens."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You invest ₦100,000 of your own and borrow ₦100,000 to hold ₦200,000 of shares. The shares fall 20% to ₦160,000. You still owe ₦100,000, so your ₦100,000 is now ₦60,000. That is a 40% loss on your own money, before interest."
                    }
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ps-1",
                        "q": "What is position sizing?",
                        "options": ["Choosing a stock’s ticker", "Deciding how much to invest in each position", "Setting the share price", "Choosing a broker"],
                        "answer": 1,
                        "explain": "Position size controls how much any one investment can hurt you."
                    },
                    {
                        "id": "ps-2",
                        "q": "Your portfolio is ₦2,000,000 and you cap any stock at 10%. What is the most you put in one stock?",
                        "options": ["₦20,000", "₦2,000", "₦100,000", "₦200,000"],
                        "answer": 3,
                        "explain": "10% of ₦2,000,000 is ₦200,000."
                    },
                    {
                        "id": "ps-3",
                        "q": "Your portfolio is ₦2,000,000. If you risk 1% on one idea, how much is that?",
                        "options": ["₦2,000", "₦20,000", "₦200,000", "₦1,000"],
                        "answer": 1,
                        "explain": "1% of ₦2,000,000 is ₦20,000."
                    },
                    {
                        "id": "ps-4",
                        "q": "You buy at ₦100, will exit at ₦90, and risk ₦20,000 in total. How many shares can you buy?",
                        "options": ["2,000", "200", "20,000", "100"],
                        "answer": 0,
                        "explain": "Loss per share is ₦10. ₦20,000 ÷ ₦10 = 2,000 shares."
                    },
                    {
                        "id": "ps-5",
                        "q": "What is a stop-loss for?",
                        "options": ["To guarantee a profit", "To pay a dividend", "To limit a loss by exiting at a set level", "To raise the price"],
                        "answer": 2,
                        "explain": "A stop-loss sets an exit in advance so a loss does not grow."
                    },
                    {
                        "id": "ps-6",
                        "q": "What is a limitation of a stop-loss?",
                        "options": ["It always sells at your exact price", "It removes all risk", "It stops dividends", "The price can gap past it, so you may sell lower than planned"],
                        "answer": 3,
                        "explain": "A fast drop or thin trading can make the actual sale price worse than your stop."
                    },
                    {
                        "id": "ps-7",
                        "q": "A trade has a 3:1 risk-reward ratio. What does that mean?",
                        "options": ["The possible gain is three times the possible loss", "You will win three times in a row", "The possible loss is three times the gain", "The fee is 3%"],
                        "answer": 0,
                        "explain": "For every ₦1 risked, the target gain is ₦3."
                    },
                    {
                        "id": "ps-8",
                        "q": "You buy at ₦100, exit at ₦90 if wrong, and target ₦130 if right. What is the risk-reward ratio?",
                        "options": ["1:1", "2:1", "3:1", "4:1"],
                        "answer": 2,
                        "explain": "Risk is ₦10 and reward is ₦30, so 30 ÷ 10 = 3."
                    },
                    {
                        "id": "ps-9",
                        "q": "At a 2:1 reward-to-risk ratio, about how often must you be right to break even, ignoring costs?",
                        "options": ["Every time", "Nine in ten", "One in two", "One in three"],
                        "answer": 3,
                        "explain": "Two wins in six trades cover four losses: win 2 × 2 = 4, lose 4 × 1 = 4."
                    },
                    {
                        "id": "ps-10",
                        "q": "Does a good risk-reward ratio guarantee profit?",
                        "options": ["Yes", "Yes, for large stocks", "No, it only describes the setup", "Only with a stop-loss"],
                        "answer": 2,
                        "explain": "The ratio helps you size risk, but any single trade can still lose."
                    },
                    {
                        "id": "ps-11",
                        "q": "What is leverage?",
                        "options": ["A tax on gains", "Using borrowed money to hold more than you could afford", "A type of dividend", "A broker fee"],
                        "answer": 1,
                        "explain": "Leverage increases your exposure by borrowing."
                    },
                    {
                        "id": "ps-12",
                        "q": "You invest ₦100,000 of your own and borrow ₦100,000. The shares fall 20%. What is your loss on your own money, ignoring interest?",
                        "options": ["20%", "10%", "60%", "40%"],
                        "answer": 3,
                        "explain": "₦200,000 falls to ₦160,000. You owe ₦100,000, so your ₦100,000 becomes ₦60,000, a 40% loss."
                    },
                    {
                        "id": "ps-13",
                        "q": "Why is leverage dangerous?",
                        "options": ["It magnifies losses as well as gains", "It removes volatility", "It lowers risk", "It only works for bonds"],
                        "answer": 0,
                        "explain": "Losses grow just as fast as gains, and the loan must still be repaid."
                    },
                    {
                        "id": "ps-14",
                        "q": "A stock that is 5% of your portfolio falls 50%. How much does the whole portfolio fall from this?",
                        "options": ["50%", "5%", "25%", "2.5%"],
                        "answer": 3,
                        "explain": "50% of 5% is 2.5%."
                    },
                    {
                        "id": "ps-15",
                        "q": "Which is a sound habit?",
                        "options": ["Decide your exit and size before you buy", "Add more as the price falls without a plan", "Size by gut feeling", "Put everything in one idea"],
                        "answer": 0,
                        "explain": "Deciding the plan beforehand keeps emotion out of it."
                    }
                ]
            }
        },

        {
            "id": "asset-allocation-rebalancing",
            "title": "Asset allocation and rebalancing",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "The big decision",
                    "body": [
                        "**Asset allocation** is how you split your money between asset classes such as shares, bonds and cash. It has a bigger effect on how bumpy your ride is than which individual stocks you pick.",
                        "Shares offer higher growth but swing more. Bonds and cash are steadier but grow less. A mix balances the two."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A growth-minded investor might hold 70% shares, 20% bonds and 10% cash. A cautious one might hold 30% shares, 50% bonds and 20% cash."
                    }
                },
                {
                    "title": "Choosing your mix",
                    "body": [
                        "There is no best allocation for everyone. It depends on three things you have already met: your goals, your time horizon and your risk tolerance.",
                        "As a general pattern, a longer time horizon allows more shares, because there is time to recover from falls. Money needed soon is usually kept in lower-risk assets. These are principles, not personal advice."
                    ]
                },
                {
                    "title": "Drift",
                    "body": [
                        "Markets do not respect your plan. When one asset rises faster, it takes up a bigger share than you intended. This is **drift**.",
                        "Drift quietly raises your risk, because your best performer is now the biggest part of the portfolio."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You start with ₦1,000,000 as ₦600,000 shares and ₦400,000 bonds (60/40). Shares rise 50% to ₦900,000. Total is now ₦1,300,000 and shares are about 69% of it."
                    }
                },
                {
                    "title": "Rebalancing",
                    "body": [
                        "**Rebalancing** means bringing your portfolio back to its target mix. You sell some of what grew and buy more of what lagged, or you direct new money to the under-weight part.",
                        "Common triggers are a set date, such as once a year, or a threshold, such as when an asset drifts a few percentage points off target. Remember that selling can cost fees and may trigger tax."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Target 60/40 on ₦1,300,000 means ₦780,000 shares and ₦520,000 bonds. You sell ₦120,000 of shares and buy ₦120,000 of bonds."
                    }
                },
                {
                    "title": "Measuring and reviewing",
                    "body": [
                        "Judge your results against a **benchmark**, such as a relevant index. A 10% gain means one thing in a year when the market rose 25% and another when it fell 5%.",
                        "Review your plan on a schedule, such as once or twice a year, or when your life changes. Do not change it because of a headline."
                    ],
                    "bullets": [
                        "Set a target mix based on goals, horizon and tolerance.",
                        "Check for drift on a schedule.",
                        "Rebalance when it has drifted enough to matter.",
                        "Compare returns with a fair benchmark."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "aa-1",
                        "q": "What is asset allocation?",
                        "options": ["Choosing one stock", "Dividing your money among asset classes", "Setting a share’s price", "Paying broker fees"],
                        "answer": 1,
                        "explain": "It is the split among shares, bonds, cash and other asset classes."
                    },
                    {
                        "id": "aa-2",
                        "q": "Which mix is generally the least volatile?",
                        "options": ["100% in one stock", "100% in shares", "Mostly bonds and cash", "Borrowed money in shares"],
                        "answer": 2,
                        "explain": "Bonds and cash usually swing less than shares."
                    },
                    {
                        "id": "aa-3",
                        "q": "A longer time horizon generally allows…",
                        "options": ["No risk at all", "More shares, since there is time to recover from falls", "Only cash", "Borrowing to invest"],
                        "answer": 1,
                        "explain": "Longer horizons give more time to ride out downturns."
                    },
                    {
                        "id": "aa-4",
                        "q": "A ₦1,000,000 portfolio is 60/40 shares to bonds. How much is in shares?",
                        "options": ["₦400,000", "₦100,000", "₦900,000", "₦600,000"],
                        "answer": 3,
                        "explain": "60% of ₦1,000,000 is ₦600,000."
                    },
                    {
                        "id": "aa-5",
                        "q": "The ₦600,000 in shares rises 50%. What is it worth now?",
                        "options": ["₦900,000", "₦650,000", "₦300,000", "₦1,200,000"],
                        "answer": 0,
                        "explain": "₦600,000 × 1.5 = ₦900,000."
                    },
                    {
                        "id": "aa-6",
                        "q": "Shares are now ₦900,000 and bonds are ₦400,000. What is the total?",
                        "options": ["₦1,000,000", "₦1,500,000", "₦1,300,000", "₦1,100,000"],
                        "answer": 2,
                        "explain": "₦900,000 + ₦400,000 = ₦1,300,000."
                    },
                    {
                        "id": "aa-7",
                        "q": "What share of the ₦1,300,000 portfolio is in shares?",
                        "options": ["About 60%", "About 69%", "About 50%", "About 90%"],
                        "answer": 1,
                        "explain": "900,000 ÷ 1,300,000 is about 0.69."
                    },
                    {
                        "id": "aa-8",
                        "q": "What is drift?",
                        "options": ["A fee on funds", "A fall in prices", "A stock split", "Your mix moving away from target because prices changed"],
                        "answer": 3,
                        "explain": "Different returns shift the weights of each asset."
                    },
                    {
                        "id": "aa-9",
                        "q": "What is rebalancing?",
                        "options": ["Bringing the portfolio back toward its target mix", "Selling everything", "Doubling your largest holding", "Changing broker"],
                        "answer": 0,
                        "explain": "You restore the original split by selling some winners and adding to laggards."
                    },
                    {
                        "id": "aa-10",
                        "q": "Target 60/40 on ₦1,300,000 means ₦780,000 in shares. You hold ₦900,000. How much do you sell to rebalance?",
                        "options": ["₦12,000", "₦520,000", "₦780,000", "₦120,000"],
                        "answer": 3,
                        "explain": "₦900,000 minus ₦780,000 is ₦120,000."
                    },
                    {
                        "id": "aa-11",
                        "q": "How can you rebalance without selling anything?",
                        "options": ["You cannot", "Buy more of the biggest asset", "Direct new money to the under-weight asset", "Borrow to invest"],
                        "answer": 2,
                        "explain": "Adding new money to the smaller part moves the mix back toward target."
                    },
                    {
                        "id": "aa-12",
                        "q": "What is a possible cost of rebalancing?",
                        "options": ["Free shares", "Trading fees and possible tax", "A higher dividend", "Lower inflation"],
                        "answer": 1,
                        "explain": "Selling and buying involves costs and may create taxable gains."
                    },
                    {
                        "id": "aa-13",
                        "q": "What is calendar rebalancing?",
                        "options": ["Rebalancing only in a crash", "Never rebalancing", "Rebalancing at set intervals, such as once a year", "Rebalancing every minute"],
                        "answer": 2,
                        "explain": "You check and adjust on a schedule rather than reacting to news."
                    },
                    {
                        "id": "aa-14",
                        "q": "Why compare your results with a benchmark?",
                        "options": ["To judge performance fairly against the market", "To set your share price", "To avoid taxes", "To remove risk"],
                        "answer": 0,
                        "explain": "A benchmark shows whether a return was good given what the market did."
                    },
                    {
                        "id": "aa-15",
                        "q": "Is there one best asset allocation for everyone?",
                        "options": ["Yes, 50/50", "Yes, 100% shares", "Yes, 100% cash", "No, it depends on goals, horizon and risk tolerance"],
                        "answer": 3,
                        "explain": "The right mix is personal."
                    }
                ]
            }
        }
    ]
},

/* ============================================
   BEYOND STOCKS: drop-in track
   Put this object right after "risk-and-diversification".
   3 lessons, 15 questions each (5 asked per try).
   All rates and prices are made up. Tell learners to check
   current T-bill and bond yields at the DMO / CBN.
   ============================================ */
{
    "id": "beyond-stocks",
    "title": "Beyond Stocks",
    "summary": "T-bills, bonds, money market funds, ETFs and REITs.",
    "level": "Intermediate",
    "theme": "blue",
    "icon": "fa-landmark",
    "lessons": [
        {
            "id": "treasury-bills-and-bonds",
            "title": "Treasury bills and government bonds",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Lending to the government",
                    "body": [
                        "When you buy a government security, you lend money to the government. In return you get paid back with interest. In Nigeria these are the main safe-income options, and their returns are the benchmark that stocks are compared against."
                    ]
                },
                {
                    "title": "Treasury bills",
                    "body": [
                        "A **treasury bill (T-bill)** is a short-term loan to the government, typically for 91, 182 or 364 days. You buy it at a **discount** to its face value and receive the full face value at the end. The difference is your return."
                    ],
                    "example": {
                        "label": "Example (numbers made up)",
                        "text": "You pay ₦90,000 for a 182-day bill with a face value of ₦100,000. At maturity you get ₦100,000. You earned ₦10,000, which is about 11.1% on ₦90,000 over six months, or roughly 22% a year."
                    }
                },
                {
                    "title": "Government bonds",
                    "body": [
                        "A **bond** is a longer loan, often several years. It usually pays a fixed interest amount, the **coupon**, every six months, and returns the **face value** on the maturity date. Federal Government bonds are issued through auctions run by the Debt Management Office (DMO).",
                        "Bonds usually pay a higher rate for longer lending, because your money is tied up longer."
                    ],
                    "example": {
                        "label": "Example (made up)",
                        "text": "A ₦100,000 bond with a 10% coupon pays ₦10,000 a year, as two payments of ₦5,000, until it matures."
                    }
                },
                {
                    "title": "Safe, but not risk-free",
                    "body": [
                        "A government of the country you invest in is generally seen as the lowest credit risk in its own currency. That does not remove every risk."
                    ],
                    "bullets": [
                        "**Inflation risk:** if inflation is higher than your yield, your buying power falls.",
                        "**Interest-rate risk:** bond prices fall if rates rise (next lesson).",
                        "**Reinvestment risk:** when a bill matures, rates may be lower.",
                        "**Liquidity:** you may not be able to sell a bond quickly at a fair price."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating a high nominal yield as a high real return. A 20% yield with 25% inflation loses buying power."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "The yield compared with current inflation.",
                        "The maturity date and whether I might need the money earlier.",
                        "Whether I buy through a licensed dealer or platform.",
                        "How easily I could sell before maturity.",
                        "Whether returns are taxed or exempt under current rules."
                    ]
                }
            ],
            "sources": [
                { "label": "Debt Management Office (DMO)", "url": "https://www.dmo.gov.ng/" },
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "tb-1", "q": "What do you do when you buy a government security?", "options": ["Own part of the government", "Lend money to the government", "Pay a tax", "Buy a share of a bank"], "answer": 1, "explain": "You lend, and are paid back with interest." },
                    { "id": "tb-2", "q": "What is a treasury bill?", "options": ["A short-term loan to the government sold at a discount", "A 30-year bond", "A bank account", "A company share"], "answer": 0, "explain": "T-bills are short-term and mature at face value." },
                    { "id": "tb-3", "q": "What does “bought at a discount” mean for a T-bill?", "options": ["You pay more than face value", "You pay less than face value and receive face value at maturity", "You receive coupons", "You get a tax refund"], "answer": 1, "explain": "The gap between price and face value is your return." },
                    { "id": "tb-4", "q": "You pay ₦90,000 for a bill with face value ₦100,000. What do you earn at maturity?", "options": ["₦90,000", "₦100,000", "₦10,000", "₦1,000"], "answer": 2, "explain": "₦100,000 minus ₦90,000 is ₦10,000." },
                    { "id": "tb-5", "q": "In that example, the return over the period on ₦90,000 is about…", "options": ["1%", "20%", "5%", "11.1%"], "answer": 3, "explain": "10,000 ÷ 90,000 is about 0.111." },
                    { "id": "tb-6", "q": "What is a bond’s coupon?", "options": ["The regular interest it pays", "Its face value", "Its maturity date", "A broker fee"], "answer": 0, "explain": "Coupons are the periodic interest payments." },
                    { "id": "tb-7", "q": "A ₦100,000 bond has a 10% coupon. How much interest does it pay each year?", "options": ["₦1,000", "₦10,000", "₦100,000", "₦20,000"], "answer": 1, "explain": "10% of ₦100,000 is ₦10,000." },
                    { "id": "tb-8", "q": "What is the face value?", "options": ["The market price today", "The yearly interest", "The amount repaid at maturity", "The fee paid"], "answer": 2, "explain": "Face value is what the bond returns when it matures." },
                    { "id": "tb-9", "q": "Which body runs Federal Government bond auctions in Nigeria?", "options": ["Nasdaq", "A stockbroker", "A bank branch", "The Debt Management Office (DMO)"], "answer": 3, "explain": "The DMO manages government borrowing." },
                    { "id": "tb-10", "q": "Why do longer bonds usually pay more than short bills?", "options": ["Your money is tied up for longer and carries more rate risk", "The law demands it", "They are riskier than shares", "Bills are illegal"], "answer": 0, "explain": "Investors expect more for committing money longer." },
                    { "id": "tb-11", "q": "What is inflation risk for a bond holder?", "options": ["The issuer closes", "Prices rising faster than your yield, reducing buying power", "Coupons doubling", "Bonds paying nothing"], "answer": 1, "explain": "A fixed payment buys less when prices rise." },
                    { "id": "tb-12", "q": "A yield is 20% and inflation is 25%. What is the real return roughly?", "options": ["+5%", "+45%", "About -5%", "0 exactly"], "answer": 2, "explain": "20% minus 25% is roughly -5%." },
                    { "id": "tb-13", "q": "Is a government bond completely risk-free?", "options": ["Yes", "Yes, for any country", "Only for T-bills", "No, inflation, interest-rate and liquidity risks remain"], "answer": 3, "explain": "Low credit risk is not the same as no risk." },
                    { "id": "tb-14", "q": "What is reinvestment risk?", "options": ["Rates may be lower when your bill matures and you buy another", "The government stops paying", "The face value falls", "Your broker closes"], "answer": 0, "explain": "You may have to reinvest at a worse rate." },
                    { "id": "tb-15", "q": "Why check how easily you can sell before maturity?", "options": ["Bonds cannot be sold", "You may need cash earlier, and selling may be hard or costly", "To change the coupon", "It sets the face value"], "answer": 1, "explain": "Liquidity affects the price you can get if you leave early." }
                ]
            }
        },

        {
            "id": "interest-rates-and-bond-prices",
            "title": "Why bond prices fall when rates rise",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "The see-saw",
                    "body": [
                        "Bond prices and interest rates move in **opposite** directions. This surprises beginners, but the logic is simple.",
                        "Suppose you hold a bond paying ₦10 a year. New bonds now pay more, say ₦15 for the same price. Nobody will pay full price for your ₦10 bond, so its price must fall until it is competitive."
                    ]
                },
                {
                    "title": "A simple way to see it",
                    "body": [
                        "A rough rule is: **price is about the yearly interest divided by the yield investors want**. It is a simplification, but it shows the effect."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A bond pays ₦10 a year. If investors want a 10% yield, it is worth ₦10 ÷ 0.10 = ₦100. If they now want 20%, it is worth ₦10 ÷ 0.20 = ₦50. Higher rates, lower price."
                    }
                },
                {
                    "title": "Yield and maturity",
                    "body": [
                        "The **yield** is the return you earn at the price you pay. Buy below face value and the yield is higher than the coupon. Buy above face value and it is lower.",
                        "Longer bonds fall more when rates rise, because you are stuck with the low payments for longer. Short bills barely move."
                    ]
                },
                {
                    "title": "Holding to maturity",
                    "body": [
                        "If you hold a bond until it matures, you receive the face value and the coupons promised, as long as the issuer pays. Falling prices in between only hurt if you have to sell early.",
                        "Rates also affect stocks. When safe bonds pay a lot, investors need more from shares to be tempted, and share prices can fall. Comparing a stock’s earnings yield (EPS ÷ price) with bond yields is a quick check."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Believing bonds cannot lose money. A bond sold before maturity after rates rise can sell for less than you paid."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "How long until maturity, as longer means more rate sensitivity.",
                        "Whether I can hold to maturity if prices fall.",
                        "Where yields have been and where policy may be heading.",
                        "The stock’s earnings yield next to safe bond yields."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov: Bonds", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "bp-r1", "q": "How are bond prices and interest rates usually related?", "options": ["They move in the same direction", "They move in opposite directions", "They are unrelated", "Bond prices set rates"], "answer": 1, "explain": "When rates rise, existing bond prices fall." },
                    { "id": "bp-r2", "q": "New bonds pay more than your existing bond. What happens to your bond’s price?", "options": ["It rises", "It stays the same", "It falls until it is competitive", "It doubles"], "answer": 2, "explain": "Buyers prefer the higher-paying new bonds, so your bond must get cheaper." },
                    { "id": "bp-r3", "q": "A bond pays ₦10 a year. Investors want a 10% yield. What is it worth, roughly?", "options": ["₦10", "₦50", "₦200", "₦100"], "answer": 3, "explain": "₦10 ÷ 0.10 = ₦100." },
                    { "id": "bp-r4", "q": "The same bond now needs a 20% yield. What is it worth, roughly?", "options": ["₦50", "₦100", "₦200", "₦20"], "answer": 0, "explain": "₦10 ÷ 0.20 = ₦50." },
                    { "id": "bp-r5", "q": "What is yield?", "options": ["The face value", "The return you earn at the price you pay", "The maturity date", "The broker fee"], "answer": 1, "explain": "Yield links the income to what you actually paid." },
                    { "id": "bp-r6", "q": "You buy a bond below its face value. What is true of the yield?", "options": ["It is lower than the coupon rate", "It is zero", "It is higher than the coupon rate", "It is negative"], "answer": 2, "explain": "You get the coupons plus the gain to face value." },
                    { "id": "bp-r7", "q": "Which falls more when rates rise?", "options": ["A 91-day bill", "A cash deposit", "A 1-week deposit", "A long-dated bond"], "answer": 3, "explain": "Long bonds are more sensitive to rate changes." },
                    { "id": "bp-r8", "q": "If you hold a bond to maturity and the issuer pays, what do you receive?", "options": ["The coupons and the face value", "Nothing", "Only the market price on any day", "Double the face value"], "answer": 0, "explain": "Interim price swings do not change the promised payments." },
                    { "id": "bp-r9", "q": "When do falling bond prices actually cost you money?", "options": ["Never", "Only on holidays", "If you sell before maturity", "Only if you buy more"], "answer": 2, "explain": "Paper losses become real when you sell." },
                    { "id": "bp-r10", "q": "Why can rising safe yields push share prices down?", "options": ["Investors need more return from shares to prefer them over safe bonds", "Dividends are cancelled", "Brokers raise fees", "Stocks pay bond coupons"], "answer": 0, "explain": "Higher safe returns make shares less attractive." },
                    { "id": "bp-r11", "q": "What is a stock’s earnings yield?", "options": ["Price divided by EPS", "EPS divided by price", "Dividend divided by price", "Profit divided by debt"], "answer": 1, "explain": "It is the inverse of the P/E ratio." },
                    { "id": "bp-r12", "q": "A stock has a P/E of 8. What is its earnings yield?", "options": ["8%", "80%", "12.5%", "0.8%"], "answer": 2, "explain": "1 ÷ 8 = 0.125, or 12.5%." },
                    { "id": "bp-r13", "q": "A stock’s earnings yield is 12.5% while a safe bond yields 20%. What does this suggest?", "options": ["The stock is a certain bargain", "Bonds are illegal", "The stock offers less than the safe bond for now, so growth must make up the gap", "Stocks never grow"], "answer": 2, "explain": "Investors in the stock are betting on growth to beat the safe alternative." },
                    { "id": "bp-r14", "q": "Which statement is correct?", "options": ["Bonds cannot lose money", "Bond prices ignore interest rates", "Bills fall more than long bonds when rates rise", "A bond sold early after rates rise can sell below its purchase price"], "answer": 3, "explain": "Rate rises reduce the price of existing bonds." },
                    { "id": "bp-r15", "q": "Why does the maturity date matter when rates change?", "options": ["Longer maturities react more to rate changes", "It sets the coupon", "It has no effect", "It sets taxes"], "answer": 0, "explain": "More years of locked-in payments means a bigger price move." }
                ]
            }
        },

        {
            "id": "money-market-funds-etfs-and-reits",
            "title": "Money market funds, ETFs and REITs",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Pooled investments",
                    "body": [
                        "Instead of buying securities one by one, you can buy a share of a pool run by a professional. You own **units** of the pool, and its value is shown as the **net asset value (NAV)** per unit."
                    ]
                },
                {
                    "title": "Money market funds",
                    "body": [
                        "A **money market fund** invests in short-term, low-risk instruments such as treasury bills, commercial paper and fixed deposits. It is popular as a place to park cash that you may need soon, while earning more than a normal savings account.",
                        "It is not guaranteed. Returns move with interest rates, fees reduce what you earn, and a fund can hold weaker instruments than you expect. Check that the manager is licensed and read what the fund holds."
                    ]
                },
                {
                    "title": "ETFs",
                    "body": [
                        "An **exchange-traded fund (ETF)** holds a basket of securities, often copying an index, and its units trade on the exchange like a share. You get many holdings in one purchase, usually with a low fee.",
                        "Because it trades like a stock, its market price can drift slightly from its NAV, and thinly traded ETFs can have wide spreads."
                    ]
                },
                {
                    "title": "REITs",
                    "body": [
                        "A **real estate investment trust (REIT)** owns income-producing property, such as offices or apartments, and passes most of its rental income to unit holders. You get property exposure without buying a building.",
                        "REIT prices still move with the market, and they depend on rents, property values and borrowing costs."
                    ]
                },
                {
                    "title": "Where each fits",
                    "bullets": [
                        "**Money market fund:** short-term cash and a safety buffer.",
                        "**ETF:** low-cost diversification across many shares or bonds.",
                        "**REIT:** property income with a stock-market ticket.",
                        "**Individual shares:** concentrated ownership of one business."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating a fund as “safe” because a fund manager runs it. Check what it holds, the fees and the licence."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "What the fund holds and how it makes its return.",
                        "The expense ratio and any entry or exit charges.",
                        "Whether the manager and trustee are licensed.",
                        "How easily I can sell, and at what spread.",
                        "How it fits my goals and time horizon."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "mf-1", "q": "What is a money market fund?", "options": ["A fund that invests in short-term, low-risk instruments", "A fund of risky start-ups", "A bank loan", "A single company share"], "answer": 0, "explain": "It holds items like T-bills and short-term deposits." },
                    { "id": "mf-2", "q": "What is a common use of a money market fund?", "options": ["Betting on one stock", "Parking cash you may need soon", "Day trading", "Borrowing"], "answer": 1, "explain": "It offers modest returns with relatively low risk." },
                    { "id": "mf-3", "q": "Is a money market fund guaranteed?", "options": ["Yes", "Yes, for fees only", "No, returns move and holdings carry some risk", "Only on Mondays"], "answer": 2, "explain": "It is low risk, not risk-free." },
                    { "id": "mf-4", "q": "What does NAV stand for?", "options": ["New asset value", "Net annual volume", "Nominal average value", "Net asset value"], "answer": 3, "explain": "NAV per unit is the value of the fund’s assets per unit." },
                    { "id": "mf-5", "q": "What is an ETF?", "options": ["A fund holding a basket of securities whose units trade on an exchange", "A type of bank account", "A tax", "A dividend"], "answer": 0, "explain": "ETF stands for exchange-traded fund." },
                    { "id": "mf-6", "q": "What is a main benefit of an index ETF?", "options": ["It guarantees profit", "It gives many holdings in one purchase, usually at low cost", "It removes market risk", "It pays no fees"], "answer": 1, "explain": "Instant diversification at modest cost." },
                    { "id": "mf-7", "q": "Why might a thinly traded ETF be a problem?", "options": ["It pays double dividends", "It cannot be sold", "It may have a wide spread, making trading costlier", "It is always free"], "answer": 2, "explain": "Low trading means a bigger gap between bid and ask." },
                    { "id": "mf-8", "q": "What does a REIT own?", "options": ["Only government bonds", "Only cash", "Foreign currencies", "Income-producing property"], "answer": 3, "explain": "A REIT pools money to own and manage property." },
                    { "id": "mf-9", "q": "How do REIT investors usually earn income?", "options": ["From a share of the rent the property earns", "From coupons on bonds", "From a savings interest rate", "From a broker bonus"], "answer": 0, "explain": "Most rental income is passed on to unit holders." },
                    { "id": "mf-10", "q": "Do REIT prices stay steady like savings?", "options": ["Yes, always", "No, they move with the market, rents and borrowing costs", "Yes, they never change", "Only in January"], "answer": 1, "explain": "REIT units trade and fluctuate in value." },
                    { "id": "mf-11", "q": "Which is the best fit for money you may need within months?", "options": ["A single volatile stock", "A REIT", "A money market fund or similar low-risk option", "A leveraged position"], "answer": 2, "explain": "Short horizons call for low-risk, easy-access options." },
                    { "id": "mf-12", "q": "What should you check before buying a fund?", "options": ["Only the name", "Only the advert", "Only last month’s return", "Holdings, fees, and whether the manager is licensed"], "answer": 3, "explain": "Know what you own and what it costs." },
                    { "id": "mf-13", "q": "A fund charges a 1% expense ratio on ₦500,000. What is the yearly cost?", "options": ["₦5,000", "₦50,000", "₦500", "₦1,000"], "answer": 0, "explain": "1% of ₦500,000 is ₦5,000." },
                    { "id": "mf-14", "q": "What do you own when you invest in a fund?", "options": ["A loan to the manager", "Units of the pool of assets", "A bank deposit", "A single company"], "answer": 1, "explain": "Units represent your share of the pool." },
                    { "id": "mf-15", "q": "Why is “a manager runs it” not proof of safety?", "options": ["Managers never charge", "Funds cannot hold risk", "Holdings, fees and the licence still need checking", "Managers set the NAV"], "answer": 2, "explain": "Professional management does not remove risk or cost." }
                ]
            }
        }
    ]
},

/* ============================================
   COSTS, FEES AND TAX: drop-in track

   In learn-content.js, find the track with
   "id": "costs-and-taxes" and replace that whole
   { ... } object with the one below.
   Lessons: 4, each with 5 sections and 15 questions.

   NOTE: Nigeria's tax rules changed on 1 January 2026.
   The tax lesson explains the principles and tells
   learners to check current rules. Review it again
   whenever the rules or thresholds are updated.
   ============================================ */

{
    "id": "costs-and-taxes",
    "title": "Costs, Fees and Tax",
    "summary": "What investing really costs you.",
    "level": "Intermediate",
    "theme": "amber",
    "icon": "fa-receipt",
    "lessons": [
        {
            "id": "costs-of-trading",
            "title": "The costs of trading",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Every trade has a price tag",
                    "body": [
                        "You do not only pay the share price. Each trade carries costs that take a bite out of your return, and they are certain while returns are not.",
                        "Common costs include the broker’s **commission**, charges from the exchange, the regulator and the central depository, and sometimes stamp duty. The exact schedule differs between brokers and over time, so always read your broker’s fee list."
                    ],
                    "bullets": [
                        "Commission or brokerage fee.",
                        "Exchange, regulator and depository charges.",
                        "Account, custody and withdrawal fees on some platforms.",
                        "Currency conversion costs on foreign stocks."
                    ]
                },
                {
                    "title": "The break-even hurdle",
                    "body": [
                        "Because you pay on the way in and on the way out, the price must rise before you are even.",
                        "The numbers below are made up to show the idea. Check your own broker’s rates."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Suppose total charges are 1.5% each way. You buy ₦200,000 of shares and pay ₦3,000, so you have spent ₦203,000. When you sell, another 1.5% comes off. The shares must rise to about ₦206,100 before you break even. That is a rise of roughly 3%."
                    }
                },
                {
                    "title": "Spread and slippage",
                    "body": [
                        "The **bid-ask spread** is a hidden cost. You buy at the higher ask and sell at the lower bid, so a round trip costs you the gap.",
                        "**Slippage** is the difference between the price you expected and the price you got. It is larger in thinly traded stocks and fast markets.",
                        "Wide spreads and big slippage often go together with low liquidity, so illiquid stocks are costlier to trade even if the commission is the same."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A stock has a bid of ₦49.90 and an ask of ₦50.10. Buy at ₦50.10 and sell straight away at ₦49.90, and you lose ₦0.20 per share, about 0.4%, before any fees."
                    }
                },
                {
                    "title": "Frequent trading adds up",
                    "body": [
                        "Costs repeat with every trade. A strategy that trades often needs far higher returns just to cover them.",
                        "A **limit order** lets you control the price you pay and can reduce slippage, though it may not execute."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "If each round trip costs 2% and you make 10 round trips in a year, costs alone take roughly 18% of your money (0.98 multiplied by itself 10 times leaves about 82%)."
                    }
                },
                {
                    "title": "US stocks and other platform costs",
                    "body": [
                        "Buying US shares from Nigeria adds layers. Turning naira into dollars usually carries an exchange-rate margin, and moving money back out can cost again. Some platforms add account, custody or withdrawal fees.",
                        "Compare the total cost, not just the headline commission. A platform with a low commission and a wide currency margin can be pricier overall."
                    ],
                    "bullets": [
                        "List every fee: trade, currency, account, withdrawal.",
                        "Trade less often.",
                        "Prefer liquid stocks and limit orders.",
                        "Check that the broker is licensed for the market."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ct-1",
                        "q": "Which of these is a common cost of trading?",
                        "options": ["A dividend", "Brokerage commission", "A stock split", "An IPO"],
                        "answer": 1,
                        "explain": "Brokers charge a commission, and other charges apply on top."
                    },
                    {
                        "id": "ct-2",
                        "q": "What is the bid-ask spread as a cost?",
                        "options": ["A tax on gains", "A yearly account fee", "The gap you give up by buying at the ask and selling at the bid", "The broker’s salary"],
                        "answer": 2,
                        "explain": "You buy at the higher price and sell at the lower one, so the gap is a cost."
                    },
                    {
                        "id": "ct-3",
                        "q": "A stock has a bid of ₦49.90 and an ask of ₦50.10. You buy at the ask and sell at the bid immediately. What do you lose per share, before fees?",
                        "options": ["₦0.20", "₦0.10", "₦50", "₦100"],
                        "answer": 0,
                        "explain": "₦50.10 minus ₦49.90 is ₦0.20."
                    },
                    {
                        "id": "ct-4",
                        "q": "Why must the price rise before you break even on a trade?",
                        "options": ["Exchanges require it", "Dividends reduce profit", "Because you pay costs both when buying and when selling", "Brokers set the price"],
                        "answer": 2,
                        "explain": "Costs on both sides must be covered before you make a gain."
                    },
                    {
                        "id": "ct-5",
                        "q": "If total charges are 1.5% each way, roughly how much is the round-trip cost?",
                        "options": ["1.5%", "3%", "0.75%", "15%"],
                        "answer": 1,
                        "explain": "1.5% on the way in plus 1.5% on the way out is about 3%."
                    },
                    {
                        "id": "ct-6",
                        "q": "What is slippage?",
                        "options": ["A type of dividend", "The difference between the expected price and the price you actually get", "A fee for opening an account", "A fall in the market"],
                        "answer": 1,
                        "explain": "Slippage happens when the market moves or is thin between your order and its execution."
                    },
                    {
                        "id": "ct-7",
                        "q": "Which stock is likely to have the wider spread?",
                        "options": ["A heavily traded stock", "A thinly traded stock", "The largest company", "A stock with high volume"],
                        "answer": 1,
                        "explain": "Fewer buyers and sellers usually means a bigger gap between bid and ask."
                    },
                    {
                        "id": "ct-8",
                        "q": "Why does frequent trading hurt returns?",
                        "options": ["It lowers volume", "It cancels dividends", "Prices rise", "Costs are paid again on every trade"],
                        "answer": 3,
                        "explain": "Costs repeat with each round trip and compound against you."
                    },
                    {
                        "id": "ct-9",
                        "q": "How can a limit order help with cost?",
                        "options": ["It guarantees a profit", "It lets you control the price you pay", "It removes the commission", "It sets the market price"],
                        "answer": 1,
                        "explain": "A limit order will not trade at a worse price than you set, though it may not fill."
                    },
                    {
                        "id": "ct-10",
                        "q": "When do currency conversion costs apply?",
                        "options": ["Only to NGX shares", "When naira is turned into dollars to buy US shares", "Only when dividends are paid", "Never"],
                        "answer": 1,
                        "explain": "Converting between naira and dollars usually includes an exchange-rate margin or fee."
                    },
                    {
                        "id": "ct-11",
                        "q": "Before choosing a broker, what should you compare?",
                        "options": ["Only the logo", "Only the headline commission", "The number of adverts", "All fees: trading, currency, account and withdrawal"],
                        "answer": 3,
                        "explain": "The total cost of using the platform matters, not one number."
                    },
                    {
                        "id": "ct-12",
                        "q": "On a ₦100,000 trade, total charges are ₦1,500. What percentage is that?",
                        "options": ["15%", "1.5%", "0.15%", "150%"],
                        "answer": 1,
                        "explain": "1,500 ÷ 100,000 = 0.015, which is 1.5%."
                    },
                    {
                        "id": "ct-13",
                        "q": "Why can small-looking fees matter over many trades?",
                        "options": ["They never add up", "Fees are refunded", "Exchanges cap total fees", "They repeat and compound against your return"],
                        "answer": 3,
                        "explain": "Repeated small costs add up to a large drag."
                    },
                    {
                        "id": "ct-14",
                        "q": "Which habit usually reduces trading costs?",
                        "options": ["Trading more often", "Using only market orders on any stock", "Trading less often and using limit orders on liquid stocks", "Ignoring the fee list"],
                        "answer": 2,
                        "explain": "Fewer trades and tighter spreads mean less paid in costs."
                    },
                    {
                        "id": "ct-15",
                        "q": "A platform has a low commission but a wide currency margin. What should you do?",
                        "options": ["Ignore the margin", "Look at the total cost of the whole transaction", "Pick it because commission is low", "Avoid all US stocks forever"],
                        "answer": 1,
                        "explain": "Total cost is what you actually pay, so compare it across platforms."
                    }
                ]
            }
        },

{
    "id": "taxes-on-investing",
    "title": "How investment returns are taxed",
    "minutes": 6,
    "status": "ready",
    "sections": [
        {
            "title": "Two things that can be taxed",
            "body": [
                "Investment returns usually come in two forms, and each can be taxed in its own way: income you receive, such as dividends, and gains you make when you sell.",
                "An **unrealized gain**, a rise in value on something you still hold, is generally not taxed until you sell. A **realized gain** happens when you sell for more than you paid."
            ],
            "tryIt": {
                "target": "calculator",
                "label": "Work out a gain in the Calculator",
                "prefill": { "market": "NGX", "shares": 100, "buy": 1000, "sell": 1300, "fee": 2000 }
            }
        },
        {
            "title": "Dividends and withholding tax",
            "body": [
                "Companies usually deduct a **withholding tax** from a dividend before paying you. The amount you receive is the net dividend. The announced amount is the gross dividend.",
                "The rate and treatment depend on current law and on who you are, so read the dividend notice from the company or registrar."
            ],
            "example": {
                "label": "Illustration (rate is made up)",
                "text": "A gross dividend of ₦10,000 with 10% withheld pays you ₦9,000. Always check the actual rate shown in your notice."
            }
        },
        {
            "title": "How share gains were taxed before 2026",
            "body": [
                "Under older versions of the Capital Gains Tax Act, gains from selling shares were fully exempt. From 2022, gains from selling shares in Nigerian companies became taxable at a flat 10%, unless an exemption applied. That was the rule most investors learned."
            ]
        },
        {
            "title": "The rules since 1 January 2026",
            "body": [
                "The Nigeria Tax Act took effect on 1 January 2026. Gains from selling shares are now part of the main tax system. For **individuals**, a chargeable gain is added to your income and taxed at your personal income tax rate. For **companies**, gains are taxed at 30%.",
                "The Act also keeps an exemption that protects most small investors. A sale of shares in Nigerian companies is exempt only if **both** tests are met in any 12 consecutive months: total sale proceeds are below ₦150 million, **and** the gain does not exceed ₦10 million.",
                "There is also a **reinvestment relief**. Gains are not taxable where the proceeds are reinvested in shares of Nigerian companies within the same year of assessment."
            ],
            "example": {
                "label": "How a gain is counted",
                "text": "You buy shares for ₦100,000 and sell them for ₦130,000. Allowable costs are ₦2,000. The gain is ₦130,000 - ₦100,000 - ₦2,000 = ₦28,000. Proceeds of ₦130,000 are far below ₦150 million and the gain is far below ₦10 million, so this sale would normally fall inside the exemption. Check your own full 12-month total."
            }
        },
        {
            "title": "Losses, foreign holdings and bonds",
            "body": [
                "A **realized loss** can matter at tax time. The Act expressly allows individuals to deduct capital losses when working out taxable income, subject to the rules. It is less clear for companies.",
                "For US shares, the exemption above covers shares in Nigerian companies, so it does not simply carry over. Your gain in naira also includes the exchange rate effect, and US dividends may have tax taken at source in the US. These cases are more complex, so check them carefully.",
                "Interest on federal government bonds remains exempt, and the exemption now extends to state bonds. It does not extend to corporate bonds."
            ]
        },
        {
            "title": "Keep records and ask a professional",
            "body": [
                "Good records save time and stress. Keep contract notes, dividend notices, CSCS statements and broker statements, and note the date, price and costs of each trade. They also let you total your 12-month proceeds and gains.",
                "Gaze explains the ideas, but it is not tax advice. The law is new and may be clarified. For your own situation, ask a qualified tax adviser or the Nigeria Revenue Service."
            ],
            "bullets": [
                "Realized gains are what normally get taxed.",
                "Most small investors fall under the ₦150 million and ₦10 million tests, but check both.",
                "Dividends usually arrive after withholding tax.",
                "Rules changed in 2026, so check the latest.",
                "Keep every statement and notice."
            ]
        }
    ],
    "sources": [
        { "label": "Nigeria Revenue Service", "url": "https://www.nrs.gov.ng/" },
        { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
    ],
    "check": {
        "perSession": 5,
        "passMark": 4,
        "questions": [
            { "id": "tx-1", "q": "When is a gain on shares generally taxed?", "options": ["Every day the price rises", "When you sell and realize it", "When you open an account", "Never"], "answer": 1, "explain": "An unrealized gain is generally not taxed until you sell." },
            { "id": "tx-2", "q": "How is a capital gain worked out?", "options": ["Proceeds minus cost, after allowable costs", "Share price times shares", "Revenue minus profit", "Dividend divided by price"], "answer": 0, "explain": "You compare what you received with what you paid, allowing for permitted costs." },
            { "id": "tx-3", "q": "You buy for ₦100,000, sell for ₦130,000, and allowable costs are ₦2,000. What is the gain?", "options": ["₦30,000", "₦32,000", "₦28,000", "₦2,000"], "answer": 2, "explain": "₦130,000 - ₦100,000 - ₦2,000 = ₦28,000." },
            { "id": "tx-4", "q": "What is withholding tax on a dividend?", "options": ["A fee for buying shares", "Tax deducted before the dividend is paid to you", "A refund from the company", "A broker commission"], "answer": 1, "explain": "The tax is taken at source, so you receive the net amount." },
            { "id": "tx-5", "q": "A gross dividend of ₦10,000 has 10% withheld. What do you receive?", "options": ["₦10,000", "₦1,000", "₦11,000", "₦9,000"], "answer": 3, "explain": "10% of ₦10,000 is ₦1,000, leaving ₦9,000." },
            { "id": "tx-6", "q": "What is a net dividend?", "options": ["The announced amount before deductions", "The amount after deductions", "The dividend yield", "The share price"], "answer": 1, "explain": "Net means after tax or other deductions." },
            { "id": "tx-7", "q": "Under Nigeria’s 2026 tax law, how are individuals’ capital gains generally taxed?", "options": ["They are never taxed", "At a flat 100%", "Added to taxable income and taxed at personal income tax rates", "Only on foreign stocks"], "answer": 2, "explain": "Individuals’ gains are assessed within their total income at the applicable personal rates." },
            { "id": "tx-8", "q": "What rate applies to gains of companies under the new law?", "options": ["0%", "10%", "5%", "30%"], "answer": 3, "explain": "Companies’ gains are taxed at the 30% company rate." },
            { "id": "tx-9", "q": "For the exemption on selling Nigerian shares, which two conditions must both be met in 12 consecutive months?", "options": ["Proceeds under ₦150 million and gain not above ₦10 million", "Proceeds over ₦150 million and gain over ₦10 million", "Only that you hold for a year", "Only that you use a licensed broker"], "answer": 0, "explain": "Both the proceeds test and the gain test must be satisfied." },
            { "id": "tx-10", "q": "Under the new Act, what can individuals do with capital losses?", "options": ["Nothing at all", "Convert them to dividends", "Deduct them when working out taxable income, subject to the rules", "Add them to profit"], "answer": 2, "explain": "The Act allows individuals to deduct capital losses in working out taxable income." },
            { "id": "tx-11", "q": "Which records are worth keeping?", "options": ["Only advertisements", "Nothing", "Only the ticker", "Contract notes, dividend notices and statements"], "answer": 3, "explain": "These show dates, prices and costs for your tax calculations." },
            { "id": "tx-12", "q": "For a US share, what else affects your gain in naira?", "options": ["The broker’s logo", "The ticker length", "The company’s phone number", "Changes in the exchange rate"], "answer": 3, "explain": "Your gain in naira includes the share price move and the currency move." },
            { "id": "tx-13", "q": "What does the reinvestment relief do?", "options": ["Doubles your gain", "Makes gains not taxable where proceeds are reinvested in Nigerian company shares in the same year of assessment", "Cancels dividends", "Applies only to bonds"], "answer": 1, "explain": "It encourages money to stay invested in the Nigerian market." },
            { "id": "tx-14", "q": "Who should you ask for advice on your own tax position?", "options": ["A stranger online", "A qualified tax adviser or the tax authority", "Only a stock tip group", "Nobody"], "answer": 1, "explain": "Personal tax depends on your circumstances, so use a qualified source." },
            { "id": "tx-15", "q": "Before 2022, how were gains on selling shares in Nigerian companies treated under the old Act?", "options": ["Taxed at 30%", "Fully exempt", "Taxed at 50%", "Taxed at your income rate"], "answer": 1, "explain": "Gains were exempt, then taxed at 10% from 2022, and are now under the 2026 rules." }
        ]
    }
},

        {
            "id": "inflation-and-compounding",
            "title": "Inflation, compounding and real returns",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Inflation: the silent cost",
                    "body": [
                        "**Inflation** is the general rise in prices over time. As prices rise, each naira buys less. This is a loss of purchasing power, and it affects cash, savings and investments alike.",
                        "An investment can go up in naira and still leave you poorer in what you can buy."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A basket of goods costs ₦100,000 today. With 20% inflation, it costs ₦120,000 next year. Money that has not grown by at least 20% buys less than before."
                    }
                },
                {
                    "title": "Nominal and real returns",
                    "body": [
                        "A **nominal return** is the headline return. A **real return** is the return after taking inflation into account. The real return is what matters for your buying power.",
                        "A quick estimate is nominal return minus inflation. The exact way is to divide (1 + nominal) by (1 + inflation) and subtract 1."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "An investment earns 15% while inflation is 20%. The quick estimate is -5%. The exact figure is 1.15 ÷ 1.20 - 1 = about -4%. You earned a positive nominal return but a negative real return."
                    }
                },
                {
                    "title": "The power of compounding",
                    "body": [
                        "**Compounding** means you earn returns on your earlier returns, not only on your original money. Growth builds on growth, so the curve bends upward over time."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "₦100,000 growing at 10% a year becomes ₦110,000 after one year, ₦121,000 after two and ₦133,100 after three. After 10 years it is about ₦259,374."
                    }
                },
                {
                    "title": "The rule of 72 and the value of time",
                    "body": [
                        "A quick way to estimate doubling time is the **rule of 72**. Divide 72 by the yearly return to get roughly how many years it takes to double.",
                        "At 8% it takes about 9 years. At 12% about 6 years. Because growth builds on growth, starting early often matters more than starting big."
                    ]
                },
                {
                    "title": "Fees compound too",
                    "body": [
                        "Costs work against you in the same way that returns work for you. A small yearly drag removes growth that would itself have grown.",
                        "This is why a difference of one or two percentage points a year matters so much over decades."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "₦100,000 at 10% for 10 years grows to about ₦259,374. At 8% (a 2-point fee drag) it grows to about ₦215,892. The gap is about ₦43,482."
                    }
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ic-1",
                        "q": "What is inflation?",
                        "options": ["A fall in all prices", "A general rise in prices over time", "A stock split", "A broker fee"],
                        "answer": 1,
                        "explain": "Inflation is the general increase in prices over time."
                    },
                    {
                        "id": "ic-2",
                        "q": "What does inflation do to the buying power of money?",
                        "options": ["Raises it", "Leaves it unchanged", "Doubles it", "Reduces it, since each naira buys less"],
                        "answer": 3,
                        "explain": "Rising prices mean the same naira buys fewer goods."
                    },
                    {
                        "id": "ic-3",
                        "q": "A basket costs ₦100,000 today and inflation is 20%. What does it cost next year?",
                        "options": ["₦120,000", "₦20,000", "₦80,000", "₦200,000"],
                        "answer": 0,
                        "explain": "₦100,000 × 1.20 = ₦120,000."
                    },
                    {
                        "id": "ic-4",
                        "q": "What is a nominal return?",
                        "options": ["The return after inflation", "The return after tax only", "The headline return before adjusting for inflation", "A negative return"],
                        "answer": 2,
                        "explain": "Nominal returns ignore the effect of rising prices."
                    },
                    {
                        "id": "ic-5",
                        "q": "What is a real return?",
                        "options": ["The return after adjusting for inflation", "The return before fees", "The dividend yield", "The share price change"],
                        "answer": 0,
                        "explain": "Real return shows the change in buying power."
                    },
                    {
                        "id": "ic-6",
                        "q": "An investment earns 15% and inflation is 20%. What is the approximate real return?",
                        "options": ["+35%", "+5%", "0%", "About -5%"],
                        "answer": 3,
                        "explain": "15% minus 20% is about -5%. The exact figure is about -4%."
                    },
                    {
                        "id": "ic-7",
                        "q": "Can an investment have a positive nominal return and a negative real return?",
                        "options": ["Yes, when inflation exceeds the return", "No, never", "Only for bonds", "Only for shares"],
                        "answer": 0,
                        "explain": "If prices rise faster than your money grows, you lose buying power."
                    },
                    {
                        "id": "ic-8",
                        "q": "What is compounding?",
                        "options": ["Earning returns only on the original amount", "A type of tax", "Earning returns on earlier returns as well", "A broker order"],
                        "answer": 2,
                        "explain": "Growth builds on growth, so the curve steepens over time."
                    },
                    {
                        "id": "ic-9",
                        "q": "₦100,000 grows at 10% a year for 2 years. What is it worth?",
                        "options": ["₦120,000", "₦121,000", "₦110,000", "₦200,000"],
                        "answer": 1,
                        "explain": "₦100,000 × 1.1 × 1.1 = ₦121,000."
                    },
                    {
                        "id": "ic-10",
                        "q": "₦100,000 grows at 10% a year for 3 years. What is it worth?",
                        "options": ["₦130,000", "₦133,100", "₦131,000", "₦110,000"],
                        "answer": 1,
                        "explain": "₦121,000 × 1.1 = ₦133,100."
                    },
                    {
                        "id": "ic-11",
                        "q": "Using the rule of 72, about how long to double at 8% a year?",
                        "options": ["6 years", "12 years", "9 years", "72 years"],
                        "answer": 2,
                        "explain": "72 ÷ 8 = 9 years."
                    },
                    {
                        "id": "ic-12",
                        "q": "Using the rule of 72, about how long to double at 12% a year?",
                        "options": ["6 years", "9 years", "12 years", "3 years"],
                        "answer": 0,
                        "explain": "72 ÷ 12 = 6 years."
                    },
                    {
                        "id": "ic-13",
                        "q": "Why does starting early matter?",
                        "options": ["Early money is cheaper", "Early investors pay no tax", "It gives compounding more time to work", "Brokers charge less"],
                        "answer": 2,
                        "explain": "More time lets growth build on growth."
                    },
                    {
                        "id": "ic-14",
                        "q": "A 2-point yearly fee drag changes 10% growth into 8%. Over 10 years on ₦100,000, roughly how much does it cost?",
                        "options": ["₦2,000", "₦20,000", "₦43,000", "₦100,000"],
                        "answer": 2,
                        "explain": "At 10% you reach about ₦259,374. At 8% about ₦215,892. The gap is about ₦43,000."
                    },
                    {
                        "id": "ic-15",
                        "q": "Which grows faster over many years, simple or compound growth?",
                        "options": ["Simple", "They are identical", "Neither grows", "Compound"],
                        "answer": 3,
                        "explain": "Compound growth earns on previous gains, so it pulls ahead."
                    }
                ]
            }
        },

        {
            "id": "fund-costs",
            "title": "Fund fees and the total cost of investing",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "What funds charge",
                    "body": [
                        "A **mutual fund** or **unit trust** pools money and a **portfolio manager** invests it. That service has a price, and it comes out of the fund, which lowers your return.",
                        "The fund’s **net asset value (NAV)** per unit is reported after fees are taken."
                    ],
                    "bullets": [
                        "**Expense ratio:** the yearly fee as a percentage of the fund’s assets.",
                        "**Entry load:** a charge when you buy units.",
                        "**Exit load:** a charge when you sell units.",
                        "**Performance fee:** an extra fee when the fund beats a target."
                    ]
                },
                {
                    "title": "Reading an expense ratio",
                    "body": [
                        "The expense ratio looks small but it is charged every year, whether the fund does well or not."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "On ₦1,000,000, a 1.5% expense ratio costs ₦15,000 a year. A 0.5% fund costs ₦5,000. Over many years the gap compounds."
                    }
                },
                {
                    "title": "Active and passive",
                    "body": [
                        "An **active** fund has a manager picking investments to try to beat a **benchmark**. A **passive** fund, such as an index fund or **ETF**, simply tracks an index.",
                        "Active funds usually charge more because of research and management. Studies in many markets have found that a large share of active funds fail to beat their benchmark after fees, but results vary, and some managers do add value."
                    ]
                },
                {
                    "title": "Compare like with like",
                    "body": [
                        "Judge a fund by its performance after fees, against a fair benchmark, over a long enough period. One strong year says little.",
                        "A higher fee does not guarantee a better result. If two funds earn the same before fees, the cheaper one leaves you with more."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Two funds earn 8% before fees. Fund A charges 1% and Fund B charges 2%. You keep about 7% in A and 6% in B."
                    }
                },
                {
                    "title": "Add up the total cost",
                    "body": [
                        "The real cost of investing is the sum of every layer, so add them up before you choose.",
                        "For funds, also check who the **trustee** is, what the fund holds, and how long it has existed."
                    ],
                    "bullets": [
                        "Trading costs: commission, levies, spread.",
                        "Fund costs: expense ratio, loads, performance fees.",
                        "Currency costs on foreign assets.",
                        "Tax on dividends and gains.",
                        "Inflation, which erodes buying power."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "fc-1",
                        "q": "What is an expense ratio?",
                        "options": ["A tax on dividends", "A yearly fee as a percentage of a fund’s assets", "A broker’s commission", "The price of one unit"],
                        "answer": 1,
                        "explain": "It is the annual cost of running the fund, shown as a percentage."
                    },
                    {
                        "id": "fc-2",
                        "q": "On ₦1,000,000, a fund charges a 1.5% expense ratio. What is the yearly cost?",
                        "options": ["₦1,500", "₦150,000", "₦15,000", "₦150"],
                        "answer": 2,
                        "explain": "1.5% of ₦1,000,000 is ₦15,000."
                    },
                    {
                        "id": "fc-3",
                        "q": "On ₦2,000,000, a fund charges 0.5%. What is the yearly cost?",
                        "options": ["₦1,000", "₦100,000", "₦20,000", "₦10,000"],
                        "answer": 3,
                        "explain": "0.5% of ₦2,000,000 is ₦10,000."
                    },
                    {
                        "id": "fc-4",
                        "q": "Is a fund’s NAV reported before or after fees?",
                        "options": ["After fees have been taken out", "Before fees", "Neither", "Only after tax"],
                        "answer": 0,
                        "explain": "Fees reduce the fund’s assets, so NAV already reflects them."
                    },
                    {
                        "id": "fc-5",
                        "q": "What is an entry load?",
                        "options": ["A yearly fee", "A charge when you buy units", "A tax on gains", "A dividend"],
                        "answer": 1,
                        "explain": "An entry load is paid when you invest."
                    },
                    {
                        "id": "fc-6",
                        "q": "What is an exit load?",
                        "options": ["A charge for opening an account", "A bonus for staying", "A charge when you sell or redeem units", "A tax rate"],
                        "answer": 2,
                        "explain": "An exit load is paid when you leave the fund."
                    },
                    {
                        "id": "fc-7",
                        "q": "What is a performance fee?",
                        "options": ["An extra fee when a fund beats a target", "A fee for losing money", "A broker commission", "A government levy"],
                        "answer": 0,
                        "explain": "The manager earns extra when results beat an agreed target."
                    },
                    {
                        "id": "fc-8",
                        "q": "What does a passive fund do?",
                        "options": ["Picks stocks to beat the market", "Holds only cash", "Never trades at all", "Tracks an index"],
                        "answer": 3,
                        "explain": "Passive funds follow an index instead of trying to beat it."
                    },
                    {
                        "id": "fc-9",
                        "q": "What does an active fund try to do?",
                        "options": ["Match the index exactly", "Beat its benchmark through manager choices", "Avoid all risk", "Pay no fees"],
                        "answer": 1,
                        "explain": "An active manager makes picks aiming to outperform."
                    },
                    {
                        "id": "fc-10",
                        "q": "Why do active funds usually charge more?",
                        "options": ["The law requires it", "Their units are larger", "Research and management cost more", "They hold no stocks"],
                        "answer": 2,
                        "explain": "Analysts and managers add costs that passive funds avoid."
                    },
                    {
                        "id": "fc-11",
                        "q": "Does a higher fee guarantee better returns?",
                        "options": ["Yes", "Yes, always for active funds", "Only in a crash", "No"],
                        "answer": 3,
                        "explain": "Fees are a cost, not a promise of performance."
                    },
                    {
                        "id": "fc-12",
                        "q": "How should you judge a fund’s performance?",
                        "options": ["After fees, against a fair benchmark, over a long period", "By one good month", "By its name", "By its advertising"],
                        "answer": 0,
                        "explain": "Net returns versus a relevant benchmark over time give a fair picture."
                    },
                    {
                        "id": "fc-13",
                        "q": "Two funds earn 8% before fees. Fund A charges 1% and Fund B charges 2%. Which leaves you with more?",
                        "options": ["Fund B", "They are equal", "Fund A, about 7% versus about 6%", "Neither earns anything"],
                        "answer": 2,
                        "explain": "A nets about 7% and B about 6%."
                    },
                    {
                        "id": "fc-14",
                        "q": "Which are part of the total cost of investing?",
                        "options": ["Only the share price", "Only the broker’s fee", "Only taxes", "Trading costs, fund fees, currency costs and tax"],
                        "answer": 3,
                        "explain": "Every layer reduces what you keep."
                    },
                    {
                        "id": "fc-15",
                        "q": "In a unit trust, who looks after investors’ interests independently?",
                        "options": ["The trustee", "The broker only", "The newspaper", "The stock exchange’s cafeteria"],
                        "answer": 0,
                        "explain": "A trustee oversees that the trust deed is followed."
                    }
                ]
            }
        }
    ]
},

/* ============================================
   PRACTICAL INVESTING: drop-in track
   Put this object in the tracks array (after "costs-and-taxes"
   works well, with a comma before and after as needed).
   5 lessons, 15 questions each (5 asked per try).
   Checked 15 Nov 2026. Re-verify: dividend withholding rate,
   US dividend withholding for Nigerians (no income tax treaty
   assumed), platform names and fees.
   ============================================ */
{
    "id": "practical-investing",
    "title": "Practical Investing",
    "summary": "Dividends, bank recapitalisation, US stocks, alerts and funds.",
    "level": "Intermediate",
    "theme": "teal",
    "icon": "fa-compass",
    "lessons": [
        {
            "id": "dividend-calendars-and-mandates",
            "title": "Dividend calendars and e-dividend mandates",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Reading a dividend notice",
                    "body": [
                        "When a company declares a dividend, it publishes a notice. Learn to read the same five things every time."
                    ],
                    "bullets": [
                        "**Amount per share**, usually the gross amount before tax.",
                        "**Qualification date:** the day you must be on the register to qualify. Some notices call it the record date.",
                        "**Closure date:** the period when the register is closed for changes.",
                        "**Payment date:** the day the money is paid.",
                        "**Type:** an **interim** dividend is declared by the board during the year. A **final** dividend is proposed after the year ends and is approved by shareholders at the **AGM** before it is paid."
                    ]
                },
                {
                    "title": "Planning around the dates",
                    "body": [
                        "A share bought after the cut-off does not carry the dividend. Since the market moved to T+1, a trade settles one business day after it is made, so you generally need to buy at least one business day before the qualification date. Confirm the exact last day with your broker, especially around holidays.",
                        "A dividend is not free money. On the day the share trades without the dividend, its price normally adjusts down by about the same amount."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A share trades at ₦50 and the company declares a ₦2 dividend. After the cut-off the price may open near ₦48. You received ₦2 per share, but the shares are worth ₦2 less, so your total wealth did not jump."
                    }
                },
                {
                    "title": "The e-dividend mandate",
                    "body": [
                        "An **e-dividend mandate** is your instruction to the company’s **registrar** to pay dividends straight into your bank account. Without one, payments can be delayed, returned or left unclaimed.",
                        "You usually complete a form through the registrar or your stockbroker. Expect to give your name exactly as it appears on your share account, your bank account and BVN, and a valid ID. Names that do not match are a common reason payments fail."
                    ]
                },
                {
                    "title": "Unclaimed dividends",
                    "body": [
                        "Many investors leave dividends unclaimed because their address, phone number or bank details changed, or because they never set up a mandate. Money you cannot receive earns nothing for you.",
                        "To fix this, contact the registrar of each company you hold and update your records. Deal only with the registrar’s official channels or your licensed broker. Anyone who contacts you offering to “recover” dividends for an upfront fee is a red flag."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Buying a share the day before the cut-off, hoping to “catch” the dividend, without checking settlement timing, and then finding you were not on the register."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "The qualification, closure and payment dates in the official notice.",
                        "Whether the dividend is interim or final, and whether the AGM has approved it.",
                        "My e-dividend mandate and registrar details for every holding.",
                        "Whether earnings and free cash flow can support the dividend.",
                        "The withholding tax shown in the notice, so I know my net amount."
                    ]
                }
            ],
            "sources": [
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" },
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "dcm-1", "q": "What does the qualification date in a dividend notice show?", "options": ["The day the dividend is paid", "The day you must be on the register to qualify", "The day of the AGM", "The company’s year end"], "answer": 1, "explain": "Only shareholders on the register by that date qualify." },
                    { "id": "dcm-2", "q": "What is the payment date?", "options": ["The day the dividend is announced", "The last day to buy shares", "The day the dividend money is paid", "The day the register closes"], "answer": 2, "explain": "It is when shareholders actually receive the dividend." },
                    { "id": "dcm-3", "q": "What is an interim dividend?", "options": ["A dividend declared by the board during the year", "A dividend paid only after the AGM", "A dividend paid in goods", "A tax rebate"], "answer": 0, "explain": "Interim dividends are declared before the year ends." },
                    { "id": "dcm-4", "q": "A final dividend is generally paid after what?", "options": ["Shareholders approve it at the AGM", "The price doubles", "A broker approves it", "The exchange closes"], "answer": 0, "explain": "The board proposes it and shareholders approve it at the AGM." },
                    { "id": "dcm-5", "q": "Under T+1, when should you generally buy to be on the register by the qualification date?", "options": ["On the qualification date itself", "At least one business day before, confirming with your broker", "A week after", "Never, it cannot be done"], "answer": 1, "explain": "A trade settles one business day after it is made, so you must allow for that." },
                    { "id": "dcm-6", "q": "A share is ₦50 and a ₦2 dividend is paid. What typically happens to the price after the cut-off?", "options": ["It rises by ₦2", "It adjusts down by about ₦2", "It doubles", "It is unaffected for ever"], "answer": 1, "explain": "The dividend leaves the company, so the share is worth less." },
                    { "id": "dcm-7", "q": "Why is a dividend not simply free money?", "options": ["Dividends are illegal", "The share price normally adjusts down by about the dividend", "Dividends are always taxed 100%", "Only brokers receive them"], "answer": 1, "explain": "Your total wealth stays about the same, with part of it now paid as cash." },
                    { "id": "dcm-8", "q": "What is an e-dividend mandate?", "options": ["A loan from your broker", "Your instruction to the registrar to pay dividends directly into your bank account", "A type of share", "A government tax form"], "answer": 1, "explain": "It makes payment automatic and reduces the chance of unclaimed dividends." },
                    { "id": "dcm-9", "q": "Which is a common reason a dividend payment fails?", "options": ["Your name does not match your bank account details", "The company is too large", "You own too many shares", "The AGM was held"], "answer": 0, "explain": "Mismatched or outdated details cause failed or returned payments." },
                    { "id": "dcm-10", "q": "Who keeps the list of a company’s shareholders?", "options": ["The registrar", "The stock exchange cafeteria", "A random broker", "A bank branch"], "answer": 0, "explain": "The registrar maintains the register and handles dividend payments." },
                    { "id": "dcm-11", "q": "Someone offers to recover your unclaimed dividends for an upfront fee. What should you do?", "options": ["Pay quickly", "Treat it as a red flag and use the registrar’s official channels", "Share your PIN", "Send a deposit"], "answer": 1, "explain": "Upfront fee offers from strangers are a common scam pattern." },
                    { "id": "dcm-12", "q": "You own 500 shares and the gross dividend is ₦2 per share. What is the gross amount?", "options": ["₦250", "₦1,000", "₦100", "₦2,000"], "answer": 1, "explain": "500 × ₦2 = ₦1,000 before tax." },
                    { "id": "dcm-13", "q": "A ₦1,000 gross dividend has 10% withheld. What do you receive?", "options": ["₦100", "₦900", "₦1,100", "₦1,000"], "answer": 1, "explain": "10% of ₦1,000 is ₦100, so you receive ₦900." },
                    { "id": "dcm-14", "q": "Which should you update with the registrar when your details change?", "options": ["Your favourite stock", "Name, address, phone, bank details and mandate", "Your share price target", "Your broker’s logo"], "answer": 1, "explain": "Current details make sure payments reach you." },
                    { "id": "dcm-15", "q": "Before relying on a dividend, what is a sensible check?", "options": ["Whether earnings and cash flow can support it", "Whether the ticker is short", "Whether others are talking about it", "Nothing"], "answer": 0, "explain": "A dividend not backed by earnings and cash may be cut." }
                ]
            }
        },

        {
            "id": "bank-recapitalisation-2026",
            "title": "Bank recapitalisation: what happened and what it means",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "What the CBN required",
                    "body": [
                        "In March 2024 the Central Bank of Nigeria raised the minimum capital banks must hold. It was the first big increase since 2004, when the minimum was ₦25 billion. Banks were given 24 months, from 1 April 2024 to 31 March 2026, to comply.",
                        "The minimum depends on the licence a bank holds."
                    ],
                    "bullets": [
                        "**International** commercial banks: ₦500 billion.",
                        "**National** commercial banks: ₦200 billion.",
                        "**Regional** commercial banks: ₦50 billion.",
                        "Other categories, such as non-interest and merchant banks, had their own minimums."
                    ]
                },
                {
                    "title": "How banks raised the money",
                    "body": [
                        "Banks could raise capital in several ways, and many used more than one."
                    ],
                    "bullets": [
                        "**Rights issues:** offers of new shares to existing shareholders.",
                        "**Public offers:** selling new shares to the wider public.",
                        "**Private placements:** selling shares to selected investors.",
                        "**Mergers and acquisitions:** combining to reach the minimum together.",
                        "**Asset sales:** selling a subsidiary or business to add capital."
                    ]
                },
                {
                    "title": "The outcome",
                    "body": [
                        "The CBN reported that banks raised about ₦4.65 trillion in new capital over the 24 months, and that 33 of the 37 banks met the revised requirements by the deadline. After the deadline the focus moved to the banks that had not complied, and to stress tests the CBN ordered for commercial banks from 1 April 2026.",
                        "Details can change as the CBN publishes more information, so check its latest statements for the current position."
                    ]
                },
                {
                    "title": "What it meant for shareholders",
                    "body": [
                        "New shares mean more shares sharing the same profits, so the effects reach existing owners."
                    ],
                    "bullets": [
                        "**Dilution:** if you did not take up a rights issue, your percentage of the bank shrank.",
                        "**Lower earnings per share:** the same profit divided by more shares can lower EPS, until the new capital earns its own profit.",
                        "**Dividends:** banks often keep more profit to build capital, so payouts may be lower for a time.",
                        "**Safety:** a better-capitalised bank can absorb shocks and lend more."
                    ],
                    "example": {
                        "label": "Example (made up)",
                        "text": "A bank earns ₦100 billion with 10 billion shares, so EPS is ₦10. It issues 5 billion new shares. If profit stays ₦100 billion, EPS falls to ₦100 billion ÷ 15 billion = about ₦6.67."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Assuming that “recapitalised” means “a good investment”. Meeting the minimum shows a bank is adequately funded. It does not tell you whether it is well run, profitable or fairly priced."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "How the capital was raised, and how many new shares were issued.",
                        "The effect on EPS, book value per share and dividends.",
                        "The price paid for the new shares compared with the market price.",
                        "NPL ratio, capital adequacy and returns on equity after the raise.",
                        "Whether I took up, sold or let lapse any rights, and the effect on my stake."
                    ]
                }
            ],
            "sources": [
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "rcp-1", "q": "When was the recapitalisation deadline set by the CBN?", "options": ["31 March 2026", "31 March 2020", "1 January 2030", "30 June 2024"], "answer": 0, "explain": "Banks had 24 months, from 1 April 2024 to 31 March 2026." },
                    { "id": "rcp-2", "q": "What minimum capital applies to international commercial banks?", "options": ["₦25 billion", "₦50 billion", "₦200 billion", "₦500 billion"], "answer": 3, "explain": "International banks needed ₦500 billion." },
                    { "id": "rcp-3", "q": "What minimum capital applies to national commercial banks?", "options": ["₦200 billion", "₦500 billion", "₦10 billion", "₦25 billion"], "answer": 0, "explain": "National banks needed ₦200 billion." },
                    { "id": "rcp-4", "q": "What minimum capital applies to regional commercial banks?", "options": ["₦5 billion", "₦50 billion", "₦500 billion", "₦200 billion"], "answer": 1, "explain": "Regional banks needed ₦50 billion." },
                    { "id": "rcp-5", "q": "Before the 2024 reform, when was the last big increase in bank capital requirements?", "options": ["2024", "2015", "2004", "2020"], "answer": 2, "explain": "The earlier minimum of ₦25 billion dates from 2004." },
                    { "id": "rcp-6", "q": "Which is a way banks raised capital?", "options": ["Rights issues", "Selling their licence to a stranger", "Printing money", "Cancelling deposits"], "answer": 0, "explain": "Rights issues, public offers, private placements, mergers and asset sales were all used." },
                    { "id": "rcp-7", "q": "Roughly how much new capital did the CBN say banks raised?", "options": ["₦4.65 trillion", "₦46 million", "₦465 billion", "₦4.65 million"], "answer": 0, "explain": "The CBN reported about ₦4.65 trillion over the 24 months." },
                    { "id": "rcp-8", "q": "What happens to your percentage ownership if you ignore a rights issue and others take it up?", "options": ["It rises", "It stays the same", "It shrinks (dilution)", "It doubles"], "answer": 2, "explain": "More shares exist, so your slice is smaller." },
                    { "id": "rcp-9", "q": "A bank earns ₦100 billion with 10 billion shares, then issues 5 billion new shares. If profit is unchanged, what is EPS?", "options": ["₦10", "About ₦6.67", "₦15", "₦100"], "answer": 1, "explain": "₦100 billion ÷ 15 billion is about ₦6.67." },
                    { "id": "rcp-10", "q": "Why might a bank pay lower dividends while rebuilding capital?", "options": ["Dividends are banned", "It may keep more profit to build capital", "Shareholders refuse dividends", "Dividends are doubled"], "answer": 1, "explain": "Retained profit adds to capital." },
                    { "id": "rcp-11", "q": "Does a recapitalised bank automatically make a good investment?", "options": ["Yes, always", "No, it only shows the bank meets a minimum, not that it is profitable or fairly priced", "Yes, if its ticker is short", "Only on the NGX"], "answer": 1, "explain": "You still need to check earnings, loans and price." },
                    { "id": "rcp-12", "q": "What is a private placement?", "options": ["Selling shares to selected investors", "A free gift of shares", "A dividend", "A stock split"], "answer": 0, "explain": "Shares are offered to chosen investors instead of the whole public." },
                    { "id": "rcp-13", "q": "How is a rights issue different from a public offer?", "options": ["It is offered first to existing shareholders", "It is only for foreigners", "It has no price", "It cancels shares"], "answer": 0, "explain": "Rights are offered to existing holders in proportion to what they own." },
                    { "id": "rcp-14", "q": "Which measure helps you judge a bank after it raises capital?", "options": ["NPL ratio, capital adequacy and ROE", "The logo", "The number of branches only", "The ticker length"], "answer": 0, "explain": "These show asset quality, safety and profitability." },
                    { "id": "rcp-15", "q": "After the deadline, what did the CBN order from 1 April 2026?", "options": ["Stress tests for commercial banks", "A ban on lending", "Free shares for all", "A new exchange"], "answer": 0, "explain": "Stress tests check whether banks can withstand shocks." }
                ]
            }
        },

        {
            "id": "us-stocks-from-nigeria",
            "title": "Buying US stocks from Nigeria",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "How access works",
                    "body": [
                        "You do not buy US shares directly from a Nigerian bank branch. Most people use an app or platform that connects to a US broker. You fund it in naira, the platform converts to dollars, and the shares are held for you with the US broker as custodian.",
                        "Before you send money, confirm the platform is registered with SEC Nigeria and read where your shares are held and how withdrawals work. Use the regulator’s own register, not a link someone sent you."
                    ]
                },
                {
                    "title": "Market hours in Nigeria time",
                    "body": [
                        "The US markets trade from 9:30 a.m. to 4:00 p.m. New York time. Nigeria is on West Africa Time all year. In the US winter that is 3:30 p.m. to 10:00 p.m. in Nigeria. When the US is on daylight saving time, it is an hour earlier, 2:30 p.m. to 9:00 p.m.",
                        "US trades settle on T+1, one business day after the trade."
                    ]
                },
                {
                    "title": "The W-8BEN form and US tax on dividends",
                    "body": [
                        "As a non-US person you normally sign a **W-8BEN** form. It tells the US tax system that you are a foreign investor. It is usually valid for three years, then needs renewing.",
                        "US dividends paid to foreign investors have tax taken at source. The standard rate is 30%. Some countries have a tax treaty that lowers it. Nigeria does not currently have a comprehensive income tax treaty with the US, so the standard rate generally applies. Confirm with your platform, because rates and treatment can change.",
                        "Capital gains from selling US shares are generally not taxed by the US for foreign investors. Nigerian tax on your gains is a separate question, so check the current Nigerian rules."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A US company pays you a $100 dividend. With 30% withheld at source, you receive $70, before any platform charges or Nigerian tax considerations."
                    }
                },
                {
                    "title": "Costs and currency",
                    "body": [
                        "Turning naira into dollars usually includes an exchange-rate margin, and moving money back can cost again. Some platforms add account, custody or withdrawal fees. Compare the total cost, not only the trade commission.",
                        "Your result in naira depends on both the share price and the exchange rate. If the naira weakens, your dollar holdings are worth more naira. If it strengthens, they are worth less."
                    ]
                },
                {
                    "title": "Protections and one risk to know",
                    "body": [
                        "US brokers are normally members of **SIPC**, which can help return your securities if a broker fails. It does not protect you from market losses, and it has limits.",
                        "Foreign investors may face US **estate tax** on US assets above a fairly low threshold if the investor dies. This is easy to overlook, so ask a tax adviser if you plan to hold a large US portfolio."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Judging a platform only by its commission or app design, without checking its registration, where shares are held, the currency margin and the withdrawal timing."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Is the platform registered with SEC Nigeria, and who is the US custodian?",
                        "The W-8BEN status and the dividend withholding rate.",
                        "The total cost: conversion margin, trade, account and withdrawal fees.",
                        "How currency moves affect my result in naira.",
                        "Market hours, and the limits of my protection."
                    ]
                }
            ],
            "sources": [
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" },
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "usn-1", "q": "How do most Nigerians buy US shares?", "options": ["Through a platform that connects to a US broker", "At a bank counter with cash", "Directly from the company", "Through the CSCS"], "answer": 0, "explain": "A platform handles funding, conversion and access to a US custodian." },
                    { "id": "usn-2", "q": "What should you check before funding a US-stock platform?", "options": ["That it is registered with SEC Nigeria", "That it has a nice logo", "That a friend uses it", "That it sends many messages"], "answer": 0, "explain": "Verify registration at the regulator’s own register." },
                    { "id": "usn-3", "q": "What are regular US market hours in New York time?", "options": ["9:30 a.m. to 4:00 p.m.", "8:00 a.m. to 2:30 p.m.", "10:00 a.m. to 10:00 p.m.", "24 hours"], "answer": 0, "explain": "The regular session runs 9:30 a.m. to 4:00 p.m. New York time." },
                    { "id": "usn-4", "q": "In the US winter, when does the regular session run in Nigeria?", "options": ["3:30 p.m. to 10:00 p.m.", "9:30 a.m. to 4:00 p.m.", "1:00 a.m. to 7:00 a.m.", "12:00 p.m. to 6:00 p.m."], "answer": 0, "explain": "Nigeria is five hours ahead of New York in winter." },
                    { "id": "usn-5", "q": "What settlement cycle do US stock trades use?", "options": ["T+1", "T+5", "T+10", "Same minute"], "answer": 0, "explain": "The US moved to T+1 in 2024." },
                    { "id": "usn-6", "q": "What is a W-8BEN form?", "options": ["A form telling the US tax system you are a foreign investor", "A Nigerian tax return", "A loan form", "A broker advert"], "answer": 0, "explain": "It certifies your foreign status for US tax purposes." },
                    { "id": "usn-7", "q": "What is the standard US withholding rate on dividends for foreign investors?", "options": ["30%", "0%", "5%", "90%"], "answer": 0, "explain": "30% applies unless a tax treaty lowers it." },
                    { "id": "usn-8", "q": "A US company pays you a $100 dividend with 30% withheld. What do you receive?", "options": ["$70", "$30", "$100", "$130"], "answer": 0, "explain": "30% of $100 is $30, leaving $70." },
                    { "id": "usn-9", "q": "Does a US tax treaty always lower your dividend withholding?", "options": ["No, it depends on whether your country has a treaty with the US", "Yes, for everyone", "Only on Tuesdays", "Only for bonds"], "answer": 0, "explain": "Treaty rates apply only where a treaty exists." },
                    { "id": "usn-10", "q": "You hold US shares. The naira weakens and the share price is unchanged. What happens to the value in naira?", "options": ["It rises", "It falls", "It is unchanged", "It becomes zero"], "answer": 0, "explain": "Each dollar converts into more naira." },
                    { "id": "usn-11", "q": "Why compare total cost across platforms?", "options": ["A low commission can hide a wide currency margin", "All platforms cost the same", "Costs are set by the exchange", "Costs do not matter"], "answer": 0, "explain": "Conversion and withdrawal costs can outweigh a low commission." },
                    { "id": "usn-12", "q": "What does SIPC generally protect against?", "options": ["A US broker failing, within limits", "Market price falls", "Bad stock picks", "Naira weakness"], "answer": 0, "explain": "It is not insurance against losses from investing." },
                    { "id": "usn-13", "q": "Why might a foreign investor need to think about US estate tax?", "options": ["US assets above a threshold may be taxed if the investor dies", "It applies to every trade", "It replaces dividends", "It only affects US citizens"], "answer": 0, "explain": "Foreign investors can be exposed on US-situated assets." },
                    { "id": "usn-14", "q": "A platform has a low commission but a wide conversion margin. What should you do?", "options": ["Look at the total cost of the whole process", "Ignore the margin", "Pick it for the low commission", "Avoid all US stocks"], "answer": 0, "explain": "Total cost is what you actually pay." },
                    { "id": "usn-15", "q": "Are US capital gains on stock sales generally taxed by the US for foreign investors?", "options": ["Generally not, but check Nigerian tax rules separately", "Always at 100%", "Only on Mondays", "Always at 30%"], "answer": 0, "explain": "The US generally does not tax foreign investors’ stock gains, but Nigerian rules are separate." }
                ]
            }
        },

        {
            "id": "watchlists-and-alerts",
            "title": "Watchlists and price alerts",
            "minutes": 5,
            "status": "ready",
            "sections": [
                {
                    "title": "What a watchlist is for",
                    "body": [
                        "A **watchlist** is a short list of stocks you follow but do not own yet. It keeps your research separate from your portfolio, so interesting ideas do not turn into impulse buys.",
                        "A good watchlist is small enough to follow, such as 10 to 20 stocks, and each entry has a reason."
                    ],
                    "tryIt": {
                        "target": "explorer",
                        "label": "Find stocks to research in Explorer",
                        "prefill": {}
                    }
                },
                {
                    "title": "Give every entry a note",
                    "body": [
                        "Write one line for why a stock is on the list and what would make you buy. Without a note, a watchlist becomes a pile of tips.",
                        "Remove stocks that no longer fit. A tidy list is easier to act on."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "“Bank X: strong capital and falling NPLs. Buy interest below ₦45, which is about 30% under my estimate of value.”"
                    }
                },
                {
                    "title": "Price alerts",
                    "body": [
                        "An **alert** tells you when a price reaches a level you chose, so you do not have to watch screens all day. Set alerts from your plan, not from excitement."
                    ],
                    "bullets": [
                        "**Buy-zone alert:** the price at which a stock meets your margin of safety.",
                        "**Review alert:** a fall or rise that makes you re-check your reason for owning it.",
                        "**Big-move alert:** a large percent change in a day, which may follow news.",
                        "Use a few alerts that matter. Too many cause alert fatigue and you stop paying attention."
                    ]
                },
                {
                    "title": "An alert is a prompt, not an order",
                    "body": [
                        "When an alert fires, the next step is to check the news, the volume and your plan. It is not a signal to trade. A price touching your level on very low volume may mean little.",
                        "Remember how the market works. On the NGX, a stock can move at most 10% in a day, so a price may sit at its limit while few trades happen."
                    ]
                },
                {
                    "title": "Check how fresh the price is",
                    "body": [
                        "Free data can be delayed, and a source can fail. A trustworthy app shows when a price was last updated and marks it stale when it is old. Look at that time before you act on a number or an alert.",
                        "Gaze labels prices with their as-of time for this reason, and its alerts bell shows alerts that fired."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Setting alerts at round numbers with no reason, then buying or selling as soon as they fire."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Does every watchlist stock have a reason and a target?",
                        "Is each alert tied to my plan?",
                        "When an alert fires: what is the news, and what is the volume?",
                        "How old is the price I am looking at?",
                        "Do I remove stocks that no longer fit?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "wla-1", "q": "What is a watchlist?", "options": ["A short list of stocks you follow but may not own", "A list of all your debts", "A broker’s fee list", "A tax form"], "answer": 0, "explain": "It keeps research separate from your portfolio." },
                    { "id": "wla-2", "q": "Why keep a watchlist separate from your portfolio?", "options": ["So ideas do not turn into impulse buys", "To avoid all risk", "It lowers fees", "It raises dividends"], "answer": 0, "explain": "Separating them keeps decisions deliberate." },
                    { "id": "wla-3", "q": "Roughly how long should a watchlist be?", "options": ["Short enough to follow, such as 10 to 20", "As long as possible", "Exactly 1,000", "Empty"], "answer": 0, "explain": "A list you cannot follow is not useful." },
                    { "id": "wla-4", "q": "Why write a note for each entry?", "options": ["To record why it is there and what would make you buy", "To raise the price", "To avoid tax", "It is required"], "answer": 0, "explain": "Notes turn a list into a plan." },
                    { "id": "wla-5", "q": "What is a price alert?", "options": ["A notice when a price reaches a level you chose", "A guarantee of profit", "A tax", "A type of order that always trades"], "answer": 0, "explain": "It saves you from watching prices all day." },
                    { "id": "wla-6", "q": "Where should alert levels come from?", "options": ["Your plan, such as a buy zone", "Random round numbers", "Strangers’ tips", "Today’s mood"], "answer": 0, "explain": "Alerts should reflect decisions you made calmly." },
                    { "id": "wla-7", "q": "What is alert fatigue?", "options": ["Ignoring alerts because there are too many", "A broker fee", "A market crash", "A type of dividend"], "answer": 0, "explain": "Too many alerts make you stop paying attention." },
                    { "id": "wla-8", "q": "An alert fires. What is the best next step?", "options": ["Check the news, volume and your plan", "Buy at once", "Sell at once", "Delete the app"], "answer": 0, "explain": "An alert is a prompt to review, not an order." },
                    { "id": "wla-9", "q": "A price hits your level on very low volume. What might this mean?", "options": ["Little, because few people took part", "A sure signal to buy", "The company is bankrupt", "A dividend is coming"], "answer": 0, "explain": "Low-volume moves can be unreliable." },
                    { "id": "wla-10", "q": "What is the maximum a stock can move in one day on the NGX?", "options": ["10% up or down", "1%", "50%", "No limit"], "answer": 0, "explain": "The NGX daily band is 10% either way." },
                    { "id": "wla-11", "q": "Why should you check when a price was last updated?", "options": ["Data can be delayed or stale", "Prices never change", "It sets the price", "It is a legal rule"], "answer": 0, "explain": "Acting on an old price can mislead you." },
                    { "id": "wla-12", "q": "What does a buy-zone alert represent?", "options": ["The price at which a stock meets your margin of safety", "The highest price ever", "A dividend date", "A tax rate"], "answer": 0, "explain": "It marks a price you decided in advance is attractive." },
                    { "id": "wla-13", "q": "What is a review alert for?", "options": ["Prompting you to re-check your reason for owning a stock", "Forcing a sale", "Doubling your position", "Cancelling orders"], "answer": 0, "explain": "A large move is a reason to review, not necessarily to act." },
                    { "id": "wla-14", "q": "What should you do with a stock that no longer fits your plan?", "options": ["Remove it from the list", "Add more alerts", "Ignore the plan", "Borrow to buy it"], "answer": 0, "explain": "A tidy list is easier to act on." },
                    { "id": "wla-15", "q": "A stock on your list jumps 8% on news. What is a sensible response?", "options": ["Read the news and check volume before deciding", "Buy at once because it is rising", "Sell everything", "Ignore all news"], "answer": 0, "explain": "Understand the cause before acting." }
                ]
            }
        },

        {
            "id": "fractional-shares-etfs-index-funds",
            "title": "Fractional shares, ETFs and index funds",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Fractional shares",
                    "body": [
                        "A **fractional share** is a piece of one share. Instead of buying whole shares, you invest an amount, such as $20, and receive the matching fraction. This helps when a share costs hundreds of dollars and you want to invest a small sum or spread it across many companies.",
                        "Not every platform offers it, and some fractional holdings cannot be moved to another broker. Check the rules on yours."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "A share costs $400 and you invest $20. You own 20 ÷ 400 = 0.05 of a share. If the price rises 10%, your $20 becomes about $22."
                    }
                },
                {
                    "title": "Index funds and ETFs",
                    "body": [
                        "An **index fund** holds the same securities as an index and aims to match its return. An **ETF** (exchange-traded fund) is a fund whose units trade on an exchange like a share. Many ETFs are index funds. A single purchase gives you many holdings.",
                        "A broad ETF, such as one that tracks the S&P 500, spreads your money across about 500 large US companies. That reduces company-specific risk, though not market risk."
                    ]
                },
                {
                    "title": "Costs to compare",
                    "body": [
                        "Index funds are popular because they usually cost little. Compare these before choosing."
                    ],
                    "bullets": [
                        "**Expense ratio:** the yearly fee as a percentage of your money.",
                        "**Tracking difference:** how far the fund’s return is from its index. Fees are one cause.",
                        "**Spread:** the bid-ask gap when you buy or sell an ETF.",
                        "**Platform and currency costs:** conversion margin, commissions and withdrawal fees."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "On $1,000, a fund with a 0.05% expense ratio costs $0.50 a year. A fund charging 1% costs $10 a year. The gap compounds over time."
                    }
                },
                {
                    "title": "What you still carry",
                    "body": [
                        "An index fund removes the work of picking stocks, but it does not remove risk. If the index falls 30%, the fund falls about 30%. A fund can also be concentrated: some indexes are dominated by a handful of large companies.",
                        "A US ETF is priced in dollars, so naira investors also carry currency risk and the platform costs from the previous lesson. Some ETFs pay dividends that may have US tax taken at source."
                    ]
                },
                {
                    "title": "ETFs in the Nigerian market",
                    "body": [
                        "The NGX also lists a small number of ETFs, including some that track Nigerian indices and one that tracks gold. They are fewer and often trade less than large US ETFs, so check the spread and volume before you trade. Always read the fund’s documents and confirm the manager is licensed."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Buying an ETF because of its name or one hot year, without checking what it holds, the fee and the spread."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "What index or assets the fund holds, and how concentrated it is.",
                        "The expense ratio and tracking difference.",
                        "The spread and trading volume.",
                        "Total platform and currency costs.",
                        "How the fund fits my goals, horizon and allocation."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC): ETFs", "url": "https://www.investor.gov/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "fei-1", "q": "What is a fractional share?", "options": ["A piece of one share bought by investing an amount", "A share of a very small company", "A share that pays no dividend", "A bond coupon"], "answer": 0, "explain": "You invest an amount and own the matching fraction of a share." },
                    { "id": "fei-2", "q": "A share costs $400 and you invest $20. What fraction do you own?", "options": ["0.05", "0.5", "0.2", "5"], "answer": 0, "explain": "20 ÷ 400 = 0.05." },
                    { "id": "fei-3", "q": "That share rises 10%. About what is your $20 worth?", "options": ["$22", "$30", "$20", "$10"], "answer": 0, "explain": "$20 × 1.10 = $22." },
                    { "id": "fei-4", "q": "What is an index fund?", "options": ["A fund that aims to match the return of an index", "A fund that only picks one stock", "A savings account", "A tax"], "answer": 0, "explain": "It holds the securities in an index." },
                    { "id": "fei-5", "q": "What is an ETF?", "options": ["A fund whose units trade on an exchange like a share", "A type of loan", "A broker fee", "A dividend"], "answer": 0, "explain": "ETF stands for exchange-traded fund." },
                    { "id": "fei-6", "q": "What does a broad index ETF help with?", "options": ["Spreading money across many companies", "Guaranteeing profit", "Removing market risk", "Setting prices"], "answer": 0, "explain": "It reduces company-specific risk but not market risk." },
                    { "id": "fei-7", "q": "What is an expense ratio?", "options": ["The yearly fee as a percentage of a fund’s assets", "A tax on gains", "The ETF’s price", "A broker bonus"], "answer": 0, "explain": "It is deducted from the fund every year." },
                    { "id": "fei-8", "q": "On $1,000, a 0.05% expense ratio costs how much a year?", "options": ["$0.50", "$5", "$50", "$0.05"], "answer": 0, "explain": "0.05% of $1,000 is $0.50." },
                    { "id": "fei-9", "q": "On $1,000, a 1% expense ratio costs how much a year?", "options": ["$10", "$1", "$100", "$0.10"], "answer": 0, "explain": "1% of $1,000 is $10." },
                    { "id": "fei-10", "q": "What is tracking difference?", "options": ["How far a fund’s return is from its index", "The ETF’s ticker", "A dividend date", "The spread"], "answer": 0, "explain": "Fees and other costs cause the gap." },
                    { "id": "fei-11", "q": "If an index falls 30%, roughly what happens to an index fund that tracks it?", "options": ["It falls about 30%", "It rises", "It is unchanged", "It becomes free"], "answer": 0, "explain": "An index fund does not protect you from a market fall." },
                    { "id": "fei-12", "q": "Why check an ETF’s spread?", "options": ["A wide spread makes trading costlier", "It sets the dividend", "It avoids tax", "It is the expense ratio"], "answer": 0, "explain": "You buy at the ask and sell at the bid." },
                    { "id": "fei-13", "q": "A US ETF is priced in dollars. What extra risk does a naira investor carry?", "options": ["Currency risk", "No extra risk", "Lower fees", "Guaranteed returns"], "answer": 0, "explain": "Exchange-rate moves change the value in naira." },
                    { "id": "fei-14", "q": "Why can an index be risky even in a diversified fund?", "options": ["A few large companies may dominate it", "Indexes have no companies", "Funds cannot lose money", "ETFs are illegal"], "answer": 0, "explain": "Concentration in a few names can drive the result." },
                    { "id": "fei-15", "q": "Before buying an ETF, what should you check?", "options": ["Holdings, fees, spread and fit with your goals", "Only the name", "Only last year’s return", "Only the advert"], "answer": 0, "explain": "Know what you own and what it costs." }
                ]
            }
        }
    ]
},

/* ============================================
   THE ECONOMY AND YOUR STOCKS: drop-in track
   Put this object right after "costs-and-taxes".
   3 lessons, 15 questions each (5 asked per try).
   No current rates are stated on purpose. Learners are sent to
   the CBN for the current policy rate and inflation figures.
   ============================================ */
{
    "id": "economy-and-sectors",
    "title": "The Economy and Your Stocks",
    "summary": "Rates, inflation, the naira and how to read a bank.",
    "level": "Intermediate",
    "theme": "mauve",
    "icon": "fa-globe-africa",
    "lessons": [
        {
            "id": "interest-rates-and-inflation",
            "title": "Interest rates, inflation and the market",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Who sets interest rates?",
                    "body": [
                        "The Central Bank of Nigeria (CBN) sets a **policy rate** (the Monetary Policy Rate, or MPR) through its Monetary Policy Committee, which meets several times a year. This rate guides what banks charge each other and, indirectly, what you earn on savings and what companies pay to borrow.",
                        "The current rate and inflation figures change, so look them up on the CBN and National Bureau of Statistics websites rather than trusting a number from an old article."
                    ]
                },
                {
                    "title": "Why rates move stocks",
                    "bullets": [
                        "**Competition:** when T-bills and bonds pay a lot, safe options look attractive and money can leave stocks.",
                        "**Borrowing costs:** higher rates raise interest bills for companies with debt, which cuts profit.",
                        "**Valuation:** future profits are worth less when discounted at higher rates.",
                        "**Demand:** higher rates slow spending and borrowing, which can slow growth."
                    ]
                },
                {
                    "title": "Inflation and the real rate",
                    "body": [
                        "Inflation lifts prices. Companies that can raise prices with costs, such as many consumer goods firms, cope better than those stuck with fixed prices. Rising costs squeeze margins, and falling real incomes can reduce spending.",
                        "The **real interest rate** is the interest rate minus inflation. It tells you whether saving in safe assets really grows your buying power."
                    ],
                    "example": {
                        "label": "Example (numbers made up)",
                        "text": "A T-bill yields 18% while inflation is 25%. The real rate is about -7%. Your naira grows, but your buying power shrinks."
                    }
                },
                {
                    "title": "Different sectors, different effects",
                    "body": [
                        "The same news hits companies differently."
                    ],
                    "bullets": [
                        "**Banks:** can earn more on loans and securities when rates rise, but bad loans can grow if borrowers struggle.",
                        "**Consumer goods:** hurt by weak spending and costs, helped if they can raise prices.",
                        "**Companies with heavy debt:** hurt by high rates.",
                        "**Oil and gas:** more tied to oil prices and the exchange rate than to local interest rates."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Reading one news item as a rule: “rates up, so sell everything”. Markets often move before the announcement, and effects differ by sector."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "The current policy rate, inflation and T-bill yields from official sources.",
                        "The real rate, not just the headline rate.",
                        "How much debt a company carries, and when it must refinance.",
                        "Whether a company can pass higher costs on to customers.",
                        "What the market already expected before the decision."
                    ]
                }
            ],
            "sources": [
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" },
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "ei-1", "q": "Which body sets Nigeria’s policy rate?", "options": ["The NGX", "The CBN through its Monetary Policy Committee", "A stockbroker", "The DMO alone"], "answer": 1, "explain": "The MPC of the Central Bank of Nigeria sets the MPR." },
                    { "id": "ei-2", "q": "Where should you find the current policy rate and inflation figure?", "options": ["Old articles", "Social media posts", "Official sources such as the CBN and the National Bureau of Statistics", "Group chats"], "answer": 2, "explain": "These figures change, so use official, current sources." },
                    { "id": "ei-3", "q": "When T-bills pay much more, what can happen to money in stocks?", "options": ["Some can move to safer, higher-paying options", "Stocks always rise", "Nothing ever moves", "Dividends double"], "answer": 0, "explain": "Higher safe returns compete with shares for investor money." },
                    { "id": "ei-4", "q": "How can higher interest rates hurt a company with lots of debt?", "options": ["They lower its interest bill", "They raise its interest bill and reduce profit", "They raise its revenue", "They cancel its debt"], "answer": 1, "explain": "More of its profit goes to lenders." },
                    { "id": "ei-5", "q": "What is the real interest rate?", "options": ["The rate banks advertise", "The inflation rate", "The interest rate minus inflation", "The dividend yield"], "answer": 2, "explain": "It shows the change in buying power." },
                    { "id": "ei-6", "q": "A T-bill yields 18% and inflation is 25%. What is the real rate, roughly?", "options": ["+7%", "+43%", "0%", "About -7%"], "answer": 3, "explain": "18% minus 25% is about -7%." },
                    { "id": "ei-7", "q": "A real rate of about -7% means what?", "options": ["Your buying power is falling even though your naira grows", "You are earning 7% in real terms", "Prices are falling", "The bond is worthless"], "answer": 0, "explain": "Prices rise faster than your balance does." },
                    { "id": "ei-8", "q": "Which type of company usually copes better with inflation?", "options": ["One that cannot change prices", "One that can raise prices as costs rise", "One with no customers", "One with fixed contracts only"], "answer": 1, "explain": "Pricing power protects margins." },
                    { "id": "ei-9", "q": "How can rising rates help a bank?", "options": ["It can earn more on loans and securities", "It can stop lending", "It no longer needs deposits", "It cancels bad loans"], "answer": 0, "explain": "Higher rates can widen what it earns, though credit risks may also rise." },
                    { "id": "ei-10", "q": "What is the risk to banks when rates are very high?", "options": ["Deposits vanish for ever", "Borrowers may struggle to repay, raising bad loans", "Loans become free", "They pay no tax"], "answer": 1, "explain": "Expensive loans are harder to repay." },
                    { "id": "ei-11", "q": "Oil and gas stocks are more tied to what?", "options": ["Bank deposit rates", "Dividend dates only", "Oil prices and the exchange rate", "Broker fees"], "answer": 2, "explain": "Their revenues depend on commodity prices and currency." },
                    { "id": "ei-12", "q": "Why is “rates are up, so sell everything” too simple?", "options": ["Markets never react to rates", "Effects vary by sector, and prices often move before announcements", "Rates never change", "Selling is illegal"], "answer": 1, "explain": "Context and expectations matter." },
                    { "id": "ei-13", "q": "Why does the market often react before an official decision?", "options": ["It cannot", "Investors trade on what they expect", "Brokers set prices early", "The exchange closes"], "answer": 1, "explain": "Expectations are already in the price." },
                    { "id": "ei-14", "q": "Why discount future profits at a higher rate when rates rise?", "options": ["Future profits are worth less in today’s money", "Profits double", "Costs fall", "Tax rises"], "answer": 0, "explain": "A higher alternative return lowers what future profits are worth today." },
                    { "id": "ei-15", "q": "What is a good habit when you read about a rate decision?", "options": ["Trade at once", "Check the official source, the real rate and which companies are affected", "Ignore it", "Borrow to invest"], "answer": 1, "explain": "Look at the facts and the sectors involved before acting." }
                ]
            }
        },

        {
            "id": "the-naira-and-your-investments",
            "title": "The naira and your investments",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Why the exchange rate matters",
                    "body": [
                        "A currency’s value is a price too. When the naira weakens, it takes more naira to buy one dollar. That affects what imports cost, what exporters earn, and what your investments are worth in dollars."
                    ]
                },
                {
                    "title": "Who gains and who loses",
                    "bullets": [
                        "**Importers** that buy raw materials or goods in dollars see costs rise when the naira falls.",
                        "**Exporters and dollar earners**, such as some oil producers, can gain, because their dollar revenue converts into more naira.",
                        "**Companies with dollar debt** owe more in naira when the naira weakens.",
                        "**Banks** can see gains or losses on foreign-currency positions, depending on their exposure."
                    ]
                },
                {
                    "title": "Naira gains are not dollar gains",
                    "body": [
                        "NGX stocks are priced in naira. A stock can rise in naira and still lose value in dollars, if the naira falls by more. This matters to foreign investors and to anyone whose goals or costs are in dollars."
                    ],
                    "example": {
                        "label": "Example (made up)",
                        "text": "A stock rises from ₦100 to ₦120 (+20%). The exchange rate moves from ₦1,000 to ₦1,300 per dollar. In dollars the stock went from $0.100 to about $0.092, a fall of about 7.7%."
                    }
                },
                {
                    "title": "Holding US stocks",
                    "body": [
                        "The effect works the other way for US shares. If the naira weakens, your dollar holdings are worth more naira, even if the US share price does not move. If the naira strengthens, the opposite happens.",
                        "This is why holding both NGX and US stocks spreads currency risk, and why Gaze lets you view your total in ₦ or $."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Judging performance in naira only. A strong naira return can hide a weak real or dollar return when the currency and inflation are moving fast."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Does the company earn or owe dollars?",
                        "Does it import inputs, and can it pass on higher costs?",
                        "How did the return look in dollars and after inflation?",
                        "How much of my portfolio depends on the exchange rate?",
                        "Which official rate am I using for my calculations?"
                    ]
                }
            ],
            "sources": [
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "nf-1", "q": "When the naira weakens against the dollar, what happens?", "options": ["It takes fewer naira to buy a dollar", "It takes more naira to buy a dollar", "Nothing changes", "Dollars become free"], "answer": 1, "explain": "A weaker naira means a higher naira price per dollar." },
                    { "id": "nf-2", "q": "How can a weaker naira hurt a company that imports raw materials in dollars?", "options": ["Costs in naira rise", "Costs fall", "Revenue doubles", "Taxes vanish"], "answer": 0, "explain": "Each dollar of inputs costs more naira." },
                    { "id": "nf-3", "q": "Who may benefit from a weaker naira?", "options": ["Importers", "Companies that earn dollars", "Companies with large dollar debts", "Everyone equally"], "answer": 1, "explain": "Dollar earners convert revenue into more naira." },
                    { "id": "nf-4", "q": "What happens to a company with dollar debt if the naira weakens?", "options": ["Its debt is cancelled", "It owes less in naira", "It owes more in naira", "Nothing changes"], "answer": 2, "explain": "The same dollar debt costs more naira to repay." },
                    { "id": "nf-5", "q": "A stock rises 20% in naira while the naira weakens 30%, from ₦1,000 to ₦1,300 per dollar. What is true in dollars?", "options": ["It doubled", "It rose 20%", "It stayed the same", "It fell, to about $0.092 from $0.100"], "answer": 3, "explain": "₦120 ÷ 1,300 is about $0.092, versus ₦100 ÷ 1,000 = $0.100." },
                    { "id": "nf-6", "q": "₦100 at ₦1,000 per dollar equals what in dollars?", "options": ["$0.10", "$1", "$10", "$100"], "answer": 0, "explain": "100 ÷ 1,000 = 0.10." },
                    { "id": "nf-7", "q": "Why does this matter to a foreign investor in NGX stocks?", "options": ["Currency moves can cancel out naira gains", "Foreign investors pay no fees", "NGX prices are in dollars", "Stocks do not move"], "answer": 0, "explain": "Their returns are measured in their own currency." },
                    { "id": "nf-8", "q": "You hold US shares. The naira weakens and the share price is unchanged. What happens to the value in naira?", "options": ["It falls", "It rises", "It is unchanged", "It is zero"], "answer": 1, "explain": "Each dollar is worth more naira." },
                    { "id": "nf-9", "q": "You hold US shares. The naira strengthens and the share price is unchanged. What happens to the value in naira?", "options": ["It rises", "It doubles", "It falls", "Nothing"], "answer": 2, "explain": "Each dollar converts to fewer naira." },
                    { "id": "nf-10", "q": "How does holding both NGX and US stocks help?", "options": ["It guarantees profit", "It removes inflation", "It makes both prices equal", "It spreads currency and market risk"], "answer": 3, "explain": "The two markets and currencies do not always move together." },
                    { "id": "nf-11", "q": "Why is judging performance in naira alone risky when the currency is falling fast?", "options": ["A high naira return may hide a weak dollar or real return", "Naira returns are always lower", "Dollars are illegal", "It is not risky"], "answer": 0, "explain": "Currency and inflation can eat naira gains." },
                    { "id": "nf-12", "q": "Which question should you ask about a company in a weak-naira period?", "options": ["How many followers does it have?", "Does it earn or owe dollars, and import inputs?", "What is its logo colour?", "How old is its website?"], "answer": 1, "explain": "Its currency exposure shapes how it is affected." },
                    { "id": "nf-13", "q": "An exporter earns $10 million and the naira weakens. What happens to its naira revenue?", "options": ["It falls", "It stays the same", "It rises", "It is cancelled"], "answer": 2, "explain": "Each dollar converts into more naira." },
                    { "id": "nf-14", "q": "Why does Gaze let you view totals in ₦ or $?", "options": ["To change share prices", "To make comparing holdings in different currencies easier", "To avoid tax", "To set the exchange rate"], "answer": 1, "explain": "One currency makes totals easier to compare." },
                    { "id": "nf-15", "q": "Which statement is correct?", "options": ["Currency moves never affect stocks", "Only dollar stocks have currency risk", "NGX gains in naira always equal gains in dollars", "A stock can rise in naira and fall in dollars"], "answer": 3, "explain": "The result depends on both the price and the exchange rate." }
                ]
            }
        },

        {
            "id": "sectors-and-reading-a-bank",
            "title": "Sectors, and how to read a bank",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "Why sectors matter",
                    "body": [
                        "A **sector** is a group of companies in a similar business, such as banking, consumer goods, industrial goods (including cement), oil and gas, telecoms and insurance. Companies in a sector respond to the same forces, so they often rise and fall together.",
                        "Banks make up a large part of the Nigerian market, so understanding them goes a long way."
                    ]
                },
                {
                    "title": "How a bank makes money",
                    "body": [
                        "A bank takes deposits, pays interest on them, and lends the money out at higher rates. The gap is its **net interest income**. It also earns fees, for example on transfers, and from trading and holding securities."
                    ]
                },
                {
                    "title": "Key bank measures",
                    "bullets": [
                        "**Net interest margin (NIM):** net interest income divided by earning assets.",
                        "**NPL ratio:** non-performing loans divided by total loans. It shows how much lending has gone bad. Regulators often watch for levels above about 5%.",
                        "**Capital adequacy ratio (CAR):** how much capital the bank holds against its risks. Regulators set minimums.",
                        "**Cost-to-income ratio:** operating costs divided by income. Lower is more efficient.",
                        "**ROE** and **P/B** (price to book value), which suits banks better than P/E alone."
                    ],
                    "example": {
                        "label": "Examples (made up)",
                        "text": "Loans ₦1,000bn with ₦50bn non-performing: NPL ratio 5%. Net interest income ₦60bn on earning assets of ₦800bn: NIM 7.5%. Costs ₦45bn on income of ₦100bn: cost-to-income 45%."
                    }
                },
                {
                    "title": "Comparing banks",
                    "body": [
                        "Compare banks with each other, not with other sectors. Look at the trend. A rising NPL ratio is a warning even if profit is high. A bank growing fast with thin capital is riskier than a steady one.",
                        "Check recapitalisation news and capital requirements, since banks may raise money through rights issues or public offers, which can dilute existing holders."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Using a P/E of 3 or 4 as proof that a bank is cheap. A low multiple can reflect bad loans, weak capital or doubts about its earnings."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "NPL ratio and its trend.",
                        "Capital adequacy against the regulator’s minimum.",
                        "NIM and cost-to-income compared with peers.",
                        "P/B together with ROE.",
                        "Any capital raise or regulatory action."
                    ]
                }
            ],
            "sources": [
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "sb-1", "q": "What is a sector?", "options": ["A broker’s office", "A group of companies in a similar business", "A type of order", "A tax band"], "answer": 1, "explain": "Examples include banking, consumer goods and oil and gas." },
                    { "id": "sb-2", "q": "Why do companies in one sector often move together?", "options": ["They share the same logo", "They respond to the same forces", "They pay the same dividend", "They trade at the same hour"], "answer": 1, "explain": "Common drivers affect them all." },
                    { "id": "sb-3", "q": "What is a bank’s net interest income?", "options": ["Interest it earns minus interest it pays", "Fees only", "Its share price", "Its tax"], "answer": 0, "explain": "It is the gap between what the bank earns on loans and pays on deposits." },
                    { "id": "sb-4", "q": "What does the NPL ratio show?", "options": ["The share of loans that have gone bad", "The share price", "The bank’s tax rate", "The number of branches"], "answer": 0, "explain": "NPL stands for non-performing loans." },
                    { "id": "sb-5", "q": "A bank has ₦1,000bn in loans, with ₦50bn non-performing. What is the NPL ratio?", "options": ["50%", "0.5%", "20%", "5%"], "answer": 3, "explain": "50 ÷ 1,000 = 5%." },
                    { "id": "sb-6", "q": "A bank has net interest income of ₦60bn on earning assets of ₦800bn. What is the NIM?", "options": ["7.5%", "75%", "13.3%", "1.3%"], "answer": 0, "explain": "60 ÷ 800 = 7.5%." },
                    { "id": "sb-7", "q": "Costs are ₦45bn and income is ₦100bn. What is the cost-to-income ratio?", "options": ["4.5%", "45%", "145%", "55 times"], "answer": 1, "explain": "45 ÷ 100 = 45%." },
                    { "id": "sb-8", "q": "Is a lower cost-to-income ratio generally better?", "options": ["No, higher is better", "It is irrelevant", "Yes, it signals better efficiency", "Only for insurers"], "answer": 2, "explain": "The bank spends less to earn each naira of income." },
                    { "id": "sb-9", "q": "What does the capital adequacy ratio show?", "options": ["The share price", "How much capital the bank holds against its risks", "The dividend", "The number of customers"], "answer": 1, "explain": "Regulators set minimums to protect depositors." },
                    { "id": "sb-10", "q": "Which measure often suits banks better than P/E alone?", "options": ["Ticker length", "P/B together with ROE", "Number of ATMs", "Share count only"], "answer": 1, "explain": "Banks’ assets and equity drive value, so P/B and ROE help." },
                    { "id": "sb-11", "q": "A bank has high profit but a rising NPL ratio. What should you do?", "options": ["Ignore the ratio", "Treat the trend as a warning and investigate", "Buy more at once", "Assume loans will be repaid"], "answer": 1, "explain": "Rising bad loans can hit future profit." },
                    { "id": "sb-12", "q": "Why compare a bank’s ratios with other banks?", "options": ["Sectors have different normal levels", "All sectors are identical", "Banks have no ratios", "It sets the share price"], "answer": 0, "explain": "A bank’s numbers mean little next to a cement maker’s." },
                    { "id": "sb-13", "q": "Why could a bank’s P/E of 3 not prove it is cheap?", "options": ["P/E is always wrong", "Banks pay no dividends", "It may reflect bad loans, weak capital or doubts about future earnings", "It means a very high price"], "answer": 2, "explain": "A low multiple can signal risk rather than a bargain." },
                    { "id": "sb-14", "q": "How can a bank capital raise affect existing shareholders?", "options": ["It can dilute them if they do not take part", "It cancels their shares", "It doubles their dividend", "It has no effect"], "answer": 0, "explain": "New shares reduce each holder’s percentage stake." },
                    { "id": "sb-15", "q": "A bank grows its loans very fast while holding thin capital. What does this suggest?", "options": ["No risk", "Higher risk than a steadier bank", "Lower risk", "A guaranteed dividend"], "answer": 1, "explain": "Fast growth with little capital leaves less cushion." }
                ]
            }
        }
    ]
},

/* ============================================
   VALUATION SKILLS: drop-in track
   Put this object right after "economy-and-sectors".
   2 lessons, 15 questions each (5 asked per try).
   Level label "Advanced" is plain text; check learn.js shows it.
   ============================================ */
{
    "id": "valuation-skills",
    "title": "Valuation Skills",
    "summary": "P/B, ROE, PEG, DCF and margin of safety.",
    "level": "Advanced",
    "theme": "green",
    "icon": "fa-scale-balanced",
    "lessons": [
        {
            "id": "pb-roe-peg-and-ev",
            "title": "P/B, ROE, PEG and EV/EBITDA",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "Beyond the P/E ratio",
                    "body": [
                        "P/E is a good start, but one number can mislead. Experts use several measures and ask whether they agree. Each tool answers a different question."
                    ]
                },
                {
                    "title": "Price to book (P/B)",
                    "body": [
                        "**P/B** compares the share price with the **book value per share**, which is equity divided by shares. A P/B of 1 means you pay what the accounts say the company’s net assets are worth.",
                        "It suits banks and asset-heavy firms. A low P/B can mean a bargain, or that the assets are not worth what the books say."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Price ₦45 and book value per share ₦30 give P/B = 45 ÷ 30 = 1.5."
                    }
                },
                {
                    "title": "P/B and ROE go together",
                    "body": [
                        "A company that earns a high **return on equity** deserves a higher P/B, because each naira of equity produces more profit. A bank with a low ROE should trade near or below book. A low P/B together with a strong, steady ROE is more interesting than a low P/B alone."
                    ]
                },
                {
                    "title": "PEG and earnings yield",
                    "body": [
                        "The **PEG ratio** divides the P/E by the yearly earnings growth rate (in percent). A figure near or below 1 can suggest growth is not overpriced. It relies on a growth forecast, which can be wrong.",
                        "The **earnings yield** is EPS divided by price, the flip side of P/E. It lets you compare a stock directly with the yield on a safe bond."
                    ],
                    "example": {
                        "label": "Examples",
                        "text": "P/E 15 with expected growth of 30% a year gives PEG = 15 ÷ 30 = 0.5. A P/E of 8 gives an earnings yield of 1 ÷ 8 = 12.5%."
                    }
                },
                {
                    "title": "EV/EBITDA",
                    "body": [
                        "**Enterprise value (EV)** is market cap plus debt minus cash. It is the price of the whole business. **EBITDA** is earnings before interest, tax, depreciation and amortisation. EV/EBITDA compares companies with different debt levels and is often used for firms with heavy borrowing.",
                        "It ignores capital spending and can flatter capital-hungry businesses, so use it with free cash flow."
                    ],
                    "example": {
                        "label": "Example (made up)",
                        "text": "Market cap ₦100bn, debt ₦50bn, cash ₦10bn gives EV = ₦140bn. With EBITDA of ₦28bn, EV/EBITDA = 5."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Calling a stock cheap because one ratio is low. A cheap-looking ratio often has a reason."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "Do two or three measures agree?",
                        "Is the multiple low for a reason: debt, shrinking profit, weak assets?",
                        "How does the multiple compare with peers and the company’s own history?",
                        "How does the earnings yield compare with safe bond yields?",
                        "Are growth assumptions realistic?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" },
                { "label": "OpenStax: Principles of Finance (free)", "url": "https://openstax.org/details/books/principles-finance" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "vs-1", "q": "How is P/B calculated?", "options": ["Share price divided by book value per share", "Profit divided by price", "Debt divided by equity", "Dividend divided by price"], "answer": 0, "explain": "P/B compares price with net assets per share." },
                    { "id": "vs-2", "q": "Price is ₦45 and book value per share is ₦30. What is P/B?", "options": ["0.67", "15", "1.5", "75"], "answer": 2, "explain": "45 ÷ 30 = 1.5." },
                    { "id": "vs-3", "q": "A P/B of 1 means what?", "options": ["The company is worthless", "You pay about book value", "The stock will double", "The dividend is 1%"], "answer": 1, "explain": "Price equals net asset value per share." },
                    { "id": "vs-4", "q": "Why is P/B often used for banks?", "options": ["Banks have no profit", "Their value is closely tied to assets and equity", "Banks pay no tax", "Banks have no debt"], "answer": 1, "explain": "Assets and equity drive a bank’s earning power." },
                    { "id": "vs-5", "q": "A company earns a high, steady ROE. What does that justify?", "options": ["A lower P/B", "A zero P/B", "A higher P/B", "No dividend"], "answer": 2, "explain": "Each naira of equity produces more profit, so investors pay more for it." },
                    { "id": "vs-6", "q": "A low P/B together with a very low ROE might mean what?", "options": ["Guaranteed bargain", "The market doubts the company’s ability to earn on its assets", "High dividends", "No debt"], "answer": 1, "explain": "It may be cheap for a reason." },
                    { "id": "vs-7", "q": "How is the PEG ratio calculated?", "options": ["P/E divided by earnings growth rate", "Price divided by book", "Debt divided by growth", "EPS times growth"], "answer": 0, "explain": "It adjusts P/E for expected growth." },
                    { "id": "vs-8", "q": "P/E is 15 and expected growth is 30% a year. What is the PEG?", "options": ["45", "2", "15", "0.5"], "answer": 3, "explain": "15 ÷ 30 = 0.5." },
                    { "id": "vs-9", "q": "What is the main weakness of PEG?", "options": ["It uses no numbers", "It relies on a growth forecast that may be wrong", "It ignores price", "It only works for bonds"], "answer": 1, "explain": "A wrong growth estimate gives a wrong PEG." },
                    { "id": "vs-10", "q": "A stock has a P/E of 8. What is its earnings yield?", "options": ["8%", "80%", "0.8%", "12.5%"], "answer": 3, "explain": "1 ÷ 8 = 0.125." },
                    { "id": "vs-11", "q": "Why compare earnings yield with a safe bond yield?", "options": ["To see what the stock offers relative to a safe alternative", "To set the price", "To avoid tax", "They are unrelated"], "answer": 0, "explain": "It frames the stock against what you could earn safely." },
                    { "id": "vs-12", "q": "How is enterprise value (EV) calculated?", "options": ["Market cap minus debt plus cash", "Market cap plus debt minus cash", "Revenue minus costs", "Equity plus profit"], "answer": 1, "explain": "EV is the price of the whole business." },
                    { "id": "vs-13", "q": "Market cap ₦100bn, debt ₦50bn, cash ₦10bn. What is EV?", "options": ["₦140bn", "₦160bn", "₦60bn", "₦100bn"], "answer": 0, "explain": "100 + 50 - 10 = ₦140bn." },
                    { "id": "vs-14", "q": "EV is ₦140bn and EBITDA is ₦28bn. What is EV/EBITDA?", "options": ["0.2", "28", "168", "5"], "answer": 3, "explain": "140 ÷ 28 = 5." },
                    { "id": "vs-15", "q": "A stock looks cheap on one ratio. What is the sensible next step?", "options": ["Buy immediately", "Check other measures and ask why it is cheap", "Ignore all ratios", "Borrow to buy"], "answer": 1, "explain": "A single cheap number may hide a problem." }
                ]
            }
        },

        {
            "id": "dcf-and-margin-of-safety",
            "title": "DCF intuition and margin of safety",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "What a business is worth",
                    "body": [
                        "A business is worth the cash it will produce in the future. But ₦1 later is worth less than ₦1 today, because you could earn a return on money you have now, and inflation shrinks money later. Valuing future cash in today’s money is **discounting**."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "If you can earn 20% a year elsewhere, ₦100 due in one year is worth about ₦83.33 today (100 ÷ 1.20)."
                    }
                },
                {
                    "title": "The idea of a DCF",
                    "body": [
                        "A **discounted cash flow (DCF)** valuation estimates a company’s future free cash flows, discounts each back to today at a chosen **discount rate**, and adds them up. The result is an estimate of what the business is worth now.",
                        "In Nigeria, high interest rates push discount rates up, which lowers the value of future cash."
                    ]
                },
                {
                    "title": "A simple shortcut",
                    "body": [
                        "If a company’s cash flow will grow steadily forever, its value is about **next year’s cash flow ÷ (discount rate - growth rate)**. This is a rough shortcut, but it shows how sensitive valuation is."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "Next year’s cash is ₦10m, discount rate 20%, growth 5%: value = 10 ÷ (0.20 - 0.05) = ₦66.7m. At a 25% discount rate it falls to 10 ÷ 0.20 = ₦50m. A five-point change in the rate cut the value by about a quarter."
                    }
                },
                {
                    "title": "The limits",
                    "body": [
                        "A DCF is only as good as its guesses. Small changes in growth or the discount rate swing the answer widely. Treat it as a range, not a precise number, and be honest about how uncertain the inputs are."
                    ]
                },
                {
                    "title": "Margin of safety",
                    "body": [
                        "Because estimates can be wrong, experienced investors insist on a **margin of safety**: buying only when the price is well below their estimate of value. It gives room for mistakes."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You estimate a share is worth ₦100. With a 30% margin of safety you would only buy at ₦70 or below."
                    }
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Treating a model’s output as fact. A confident spreadsheet can rest on optimistic growth, and a precise-looking number can still be wrong."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "How sensitive the value is to the discount rate and growth.",
                        "Whether past cash flow supports the growth assumption.",
                        "A conservative, a middle and an optimistic case.",
                        "The size of the margin of safety.",
                        "Whether other measures point the same way."
                    ]
                }
            ],
            "sources": [
                { "label": "OpenStax: Principles of Finance (free)", "url": "https://openstax.org/details/books/principles-finance" },
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "dc-1", "q": "What is discounting?", "options": ["Valuing future cash in today’s money", "Selling at a discount", "A broker fee", "A dividend"], "answer": 0, "explain": "Money later is worth less than money now." },
                    { "id": "dc-2", "q": "Why is ₦1 later worth less than ₦1 today?", "options": ["Coins weigh less", "Banks forbid it", "You could earn a return on it now, and inflation shrinks it later", "It is taxed"], "answer": 2, "explain": "Time and inflation reduce the value of future money." },
                    { "id": "dc-3", "q": "At a 20% discount rate, what is ₦100 due in one year worth today, roughly?", "options": ["₦120", "₦83", "₦20", "₦100"], "answer": 1, "explain": "100 ÷ 1.20 is about 83.33." },
                    { "id": "dc-4", "q": "What does a DCF valuation estimate?", "options": ["Tomorrow’s price", "The broker’s fee", "The present value of a company’s future cash flows", "The dividend date"], "answer": 2, "explain": "It adds up discounted future free cash flows." },
                    { "id": "dc-5", "q": "A higher discount rate generally does what to a company’s estimated value?", "options": ["Raises it", "Lowers it", "Leaves it unchanged", "Doubles it"], "answer": 1, "explain": "Future cash is worth less when discounted harder." },
                    { "id": "dc-6", "q": "Why do high interest rates matter in a DCF?", "options": ["They lower discount rates", "They have no link", "They push discount rates up, lowering value", "They raise cash flows"], "answer": 2, "explain": "Higher alternative returns reduce present values." },
                    { "id": "dc-7", "q": "Next year’s cash is ₦10m, the discount rate is 20% and growth is 5%. What is the value by the shortcut?", "options": ["About ₦66.7m", "₦50m", "₦200m", "₦10m"], "answer": 0, "explain": "10 ÷ (0.20 - 0.05) = 66.7." },
                    { "id": "dc-8", "q": "Same cash, a 25% discount rate and 5% growth. What is the value?", "options": ["₦40m", "₦66.7m", "₦100m", "₦50m"], "answer": 3, "explain": "10 ÷ 0.20 = 50." },
                    { "id": "dc-9", "q": "What does the change from ₦66.7m to ₦50m show?", "options": ["Valuation is insensitive to rates", "Small input changes can swing the value a lot", "Growth is irrelevant", "The company paid a dividend"], "answer": 1, "explain": "DCF values are very sensitive to assumptions." },
                    { "id": "dc-10", "q": "What is a weakness of a DCF?", "options": ["It uses no numbers", "It ignores cash", "It is only as good as its guesses", "It sets the price"], "answer": 2, "explain": "Inputs like growth and discount rate are estimates." },
                    { "id": "dc-11", "q": "What is a margin of safety?", "options": ["A broker insurance", "Buying only well below your estimate of value", "A stop-loss order", "A bank guarantee"], "answer": 1, "explain": "It gives room for error in your estimate." },
                    { "id": "dc-12", "q": "You estimate a share is worth ₦100 and want a 30% margin of safety. What is the most you would pay?", "options": ["₦130", "₦100", "₦30", "₦70"], "answer": 3, "explain": "30% below ₦100 is ₦70." },
                    { "id": "dc-13", "q": "Why use a conservative, middle and optimistic case?", "options": ["To show the range of outcomes and the uncertainty", "To guarantee profit", "To confuse others", "To lower tax"], "answer": 0, "explain": "A range is more honest than a single figure." },
                    { "id": "dc-14", "q": "A model gives ₦137.42 per share. What is the best attitude?", "options": ["It is exactly right", "It is a rough estimate that rests on assumptions", "It must be ignored", "It sets the market price"], "answer": 1, "explain": "A precise-looking number can still be wrong." },
                    { "id": "dc-15", "q": "Why check whether past cash flow supports your growth assumption?", "options": ["Past cash is irrelevant", "Growth assumptions that ignore history may be too optimistic", "It sets the discount rate", "It cancels tax"], "answer": 1, "explain": "History is a reality check for forecasts." }
                ]
            }
        }
    ]
},




        /* ============================================
   INVESTOR MINDSET: drop-in track

   In learn-content.js, find the track with
   "id": "investor-mindset" and replace that whole
   { ... } object with the one below.
   Lessons: 4, each with 5 sections and 15 questions.
   ============================================ */

{
    "id": "investor-mindset",
    "title": "Investor Mindset",
    "summary": "Stay calm and avoid common mistakes.",
    "level": "All levels",
    "theme": "indigo",
    "icon": "fa-brain",
    "lessons": [
        {
            "id": "investor-psychology",
            "title": "Your mind and your money",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Why emotions matter",
                    "body": [
                        "Markets are made of people, and people feel fear and greed. Prices swing because investors are excited or scared, not only because of numbers.",
                        "The same emotions that help you in daily life can hurt you in investing. They push you to buy after a big rise and sell after a big fall, which is the reverse of what you want."
                    ]
                },
                {
                    "title": "Loss aversion and the disposition effect",
                    "body": [
                        "**Loss aversion** means a loss hurts more than an equal gain feels good. Research suggests roughly twice as much. It makes people avoid any chance of loss, even sensible ones.",
                        "It also drives a common habit. People sell winners too early to lock in a gain, and hold losers too long hoping to get back to even. Behavioural finance calls this the disposition effect.",
                        "The market does not know what you paid. The question is whether you would buy the stock today at today’s price."
                    ]
                },
                {
                    "title": "FOMO and the herd",
                    "body": [
                        "**FOMO**, the fear of missing out, pushes people to jump into a stock because it has already surged and everyone is talking about it. **Herd behaviour** is following the crowd instead of your own analysis.",
                        "Bubbles grow this way. Prices rise, attention grows, more people pile in, and the people who join last carry the most risk."
                    ],
                    "example": {
                        "label": "Think about it",
                        "text": "A stock doubles in a week and your group chat is full of it. By the time the news reaches you, much of the move has often already happened."
                    }
                },
                {
                    "title": "Overconfidence and other biases",
                    "body": [
                        "A few more traps to watch for."
                    ],
                    "bullets": [
                        "**Overconfidence:** overestimating what you know, which leads to too much trading.",
                        "**Confirmation bias:** looking only for information that agrees with what you already believe.",
                        "**Recency bias:** giving too much weight to what happened lately.",
                        "**Sunk cost thinking:** holding on because of what you have already put in."
                    ]
                },
                {
                    "title": "Habits that protect you",
                    "body": [
                        "You cannot switch emotions off, but you can build habits that keep them from deciding for you."
                    ],
                    "bullets": [
                        "Write a plan before you invest, with when you would buy, sell and rebalance.",
                        "Wait a day before acting on a big move or a tip.",
                        "Keep a journal of why you bought, and review it later.",
                        "Check prices less often. Constant watching invites overtrading.",
                        "Seek out views that disagree with yours."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ip-1",
                        "q": "Why do emotions matter in investing?",
                        "options": ["They never affect decisions", "They can push you to buy high and sell low", "They set share prices directly", "They remove all risk"],
                        "answer": 1,
                        "explain": "Fear and greed can lead to poorly timed decisions."
                    },
                    {
                        "id": "ip-2",
                        "q": "What is loss aversion?",
                        "options": ["Preferring losses", "Ignoring all gains", "Losses feel worse than equal gains feel good", "Avoiding every investment"],
                        "answer": 2,
                        "explain": "People feel a loss more strongly than an equal gain."
                    },
                    {
                        "id": "ip-3",
                        "q": "What is the disposition effect?",
                        "options": ["Selling winners too early and holding losers too long", "Buying only dividend stocks", "Trading every day", "Holding only cash"],
                        "answer": 0,
                        "explain": "People lock in gains quickly and avoid realizing losses."
                    },
                    {
                        "id": "ip-4",
                        "q": "What does FOMO stand for?",
                        "options": ["Fear of market orders", "Fear of missing out", "Funds of mutual options", "Fixed ownership of money"],
                        "answer": 1,
                        "explain": "FOMO is the urge to join a move because others are profiting."
                    },
                    {
                        "id": "ip-5",
                        "q": "What is herd behaviour?",
                        "options": ["Doing your own research", "Holding only one stock", "Avoiding the market", "Following the crowd instead of your own analysis"],
                        "answer": 3,
                        "explain": "Herd behaviour means copying what everyone else does."
                    },
                    {
                        "id": "ip-6",
                        "q": "What is overconfidence?",
                        "options": ["Overestimating what you know, often leading to too much trading", "Being too careful", "Diversifying widely", "Using a plan"],
                        "answer": 0,
                        "explain": "Overconfident investors trade more and take more risk than they should."
                    },
                    {
                        "id": "ip-7",
                        "q": "What is confirmation bias?",
                        "options": ["Checking facts from many sides", "Seeking information that supports what you already believe", "Confirming a trade with your broker", "Reading annual reports"],
                        "answer": 1,
                        "explain": "People favour evidence that agrees with their view and ignore the rest."
                    },
                    {
                        "id": "ip-8",
                        "q": "What is recency bias?",
                        "options": ["Giving too much weight to recent events", "Remembering only old events", "Ignoring all news", "Trusting long-term data"],
                        "answer": 0,
                        "explain": "People assume recent trends will continue."
                    },
                    {
                        "id": "ip-9",
                        "q": "What often happens to someone who panic-sells in a crash?",
                        "options": ["They always profit", "They avoid all losses", "They lock in losses and may miss the recovery", "They receive a dividend"],
                        "answer": 2,
                        "explain": "Selling at the bottom turns a paper loss into a real one."
                    },
                    {
                        "id": "ip-10",
                        "q": "Which is the best protection against emotional decisions?",
                        "options": ["Check prices hourly", "Follow tips", "Trade more", "A written plan with rules decided in advance"],
                        "answer": 3,
                        "explain": "Rules made while calm stop emotions from deciding for you."
                    },
                    {
                        "id": "ip-11",
                        "q": "A stock doubled this week and everyone is talking about it. What is a sensible response?",
                        "options": ["Buy at once", "Research it and avoid buying only because of the hype", "Sell everything else", "Borrow to buy more"],
                        "answer": 1,
                        "explain": "Much of the move may be over, and decisions should rest on analysis."
                    },
                    {
                        "id": "ip-12",
                        "q": "What can checking prices constantly lead to?",
                        "options": ["Better returns", "Lower fees", "Emotional decisions and overtrading", "Guaranteed profits"],
                        "answer": 2,
                        "explain": "Constant watching makes every wiggle feel urgent."
                    },
                    {
                        "id": "ip-13",
                        "q": "You tell yourself, “I’ll sell when it gets back to what I paid.” What is the flaw?",
                        "options": ["The price remembers your cost", "The market does not care what you paid", "Selling is always wrong", "Prices always recover"],
                        "answer": 1,
                        "explain": "The decision should rest on the stock’s future prospects, not your purchase price."
                    },
                    {
                        "id": "ip-14",
                        "q": "How does a trading journal help?",
                        "options": ["It sets share prices", "It removes taxes", "It lets you review why you made decisions and learn from them", "It guarantees returns"],
                        "answer": 2,
                        "explain": "Writing down your reasons reveals your patterns."
                    },
                    {
                        "id": "ip-15",
                        "q": "Which two emotions are often said to drive market swings?",
                        "options": ["Fear and greed", "Humour and calm", "Boredom and pride", "Joy and silence"],
                        "answer": 0,
                        "explain": "Markets often swing between fear and greed."
                    }
                ]
            }
        },

        {
            "id": "long-term-discipline",
            "title": "Long-term investing and discipline",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "Time in the market versus timing it",
                    "body": [
                        "**Market timing** is trying to buy just before prices rise and sell just before they fall. Almost nobody does it consistently, because short-term moves are driven by news no one can predict.",
                        "Trying also has a cost. If you step out and miss a few of the best days, the damage to your long-term return can be large. Most investors do better by staying invested according to a plan."
                    ]
                },
                {
                    "title": "Dollar-cost averaging",
                    "body": [
                        "**Dollar-cost averaging** means investing a fixed amount at regular intervals, such as every month, whatever the price. You buy more shares when prices are low and fewer when they are high.",
                        "It does not guarantee a profit or protect against loss. What it does is remove the pressure of choosing one perfect moment, and it builds a habit."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "You invest ₦50,000 a month. The price is ₦100, then ₦50, then ₦100. You buy 500, 1,000 and 500 shares: 2,000 shares for ₦150,000, an average cost of ₦75. The simple average of the three prices is about ₦83."
                    }
                },
                {
                    "title": "Buy and hold, with reviews",
                    "body": [
                        "**Buy and hold** means choosing good investments and keeping them for years, trading rarely. It cuts costs, avoids emotional mistakes and gives compounding time to work.",
                        "It does not mean never looking. Review your holdings on a schedule. Sell if the reason you bought is no longer true, or to rebalance or fund a goal."
                    ]
                },
                {
                    "title": "Get the foundations right first",
                    "body": [
                        "Investing works best when it sits on a solid base."
                    ],
                    "bullets": [
                        "Keep an emergency fund so you are never forced to sell in a downturn.",
                        "Think about paying off high-interest debt first. The interest you save is a certain return.",
                        "Invest money you will not need for years, not rent or school fees.",
                        "Expect falls. A drawdown is normal, not a sign that the plan has failed."
                    ]
                },
                {
                    "title": "Write your plan down",
                    "body": [
                        "A simple written plan, sometimes called an investment policy statement, is your defence against bad moments. It should hold your goals, your target mix, your rules for buying, selling and rebalancing, and when you will review it.",
                        "When fear or excitement arrives, you do not decide fresh. You follow what you wrote when you were calm."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "ld-1",
                        "q": "What is market timing?",
                        "options": ["Investing at regular intervals", "Trying to buy before rises and sell before falls", "Holding for decades", "Checking the clock"],
                        "answer": 1,
                        "explain": "Market timing means predicting short-term moves."
                    },
                    {
                        "id": "ld-2",
                        "q": "Why is market timing so hard?",
                        "options": ["Brokers forbid it", "Short-term moves depend on unpredictable news", "Prices never change", "It is illegal"],
                        "answer": 1,
                        "explain": "Almost no one predicts short-term moves consistently."
                    },
                    {
                        "id": "ld-3",
                        "q": "What is dollar-cost averaging?",
                        "options": ["Investing a fixed amount at regular intervals", "Buying only in dollars", "Selling at the average price", "Averaging your losses"],
                        "answer": 0,
                        "explain": "You invest the same amount on a schedule regardless of price."
                    },
                    {
                        "id": "ld-4",
                        "q": "You invest ₦50,000 each month at prices of ₦100, ₦50 and ₦100. How many shares do you buy in total?",
                        "options": ["1,500", "2,500", "3,000", "2,000"],
                        "answer": 3,
                        "explain": "500 + 1,000 + 500 = 2,000 shares."
                    },
                    {
                        "id": "ld-5",
                        "q": "In that example you spent ₦150,000 for 2,000 shares. What is the average cost per share?",
                        "options": ["₦75", "₦100", "₦50", "₦83"],
                        "answer": 0,
                        "explain": "150,000 ÷ 2,000 = ₦75."
                    },
                    {
                        "id": "ld-6",
                        "q": "Why is your average cost (₦75) lower than the simple average of prices (about ₦83)?",
                        "options": ["Fees were refunded", "The exchange cut the price", "You bought more shares when the price was low", "It is a mistake"],
                        "answer": 2,
                        "explain": "A fixed amount buys more shares at lower prices."
                    },
                    {
                        "id": "ld-7",
                        "q": "Does dollar-cost averaging guarantee a profit?",
                        "options": ["Yes", "Yes, over one year", "Only on the NGX", "No"],
                        "answer": 3,
                        "explain": "It is a method of buying, not a guarantee of results."
                    },
                    {
                        "id": "ld-8",
                        "q": "What does buy and hold mean?",
                        "options": ["Trading daily", "Selling after one week", "Choosing investments and keeping them for a long time", "Holding only cash"],
                        "answer": 2,
                        "explain": "It means investing for the long term and trading rarely."
                    },
                    {
                        "id": "ld-9",
                        "q": "Does buy and hold mean you should never review your investments?",
                        "options": ["Yes, never", "No, you should still review on a schedule", "Only in a crash", "Only after a dividend"],
                        "answer": 1,
                        "explain": "Review regularly and sell if the reasons for owning something no longer hold."
                    },
                    {
                        "id": "ld-10",
                        "q": "What should come before investing in stocks?",
                        "options": ["An emergency fund", "Borrowing money", "Buying a tip", "Day trading"],
                        "answer": 0,
                        "explain": "An emergency fund stops you from being forced to sell at a bad time."
                    },
                    {
                        "id": "ld-11",
                        "q": "Why might paying off high-interest debt come before investing?",
                        "options": ["Debt has no effect", "Interest saved is a certain return", "Banks require it", "Stocks cannot be bought with debt"],
                        "answer": 1,
                        "explain": "Avoiding high interest is a guaranteed saving."
                    },
                    {
                        "id": "ld-12",
                        "q": "Money you need for rent next month should be…",
                        "options": ["Put into a volatile stock", "Used as margin", "Used for a hot tip", "Kept in a low-risk, easy-access place"],
                        "answer": 3,
                        "explain": "Short-term needs should not be exposed to market swings."
                    },
                    {
                        "id": "ld-13",
                        "q": "What does an investment plan usually include?",
                        "options": ["A guaranteed return", "Goals, target mix, rules for buying and selling, and a review schedule", "A friend’s tips", "Daily price targets"],
                        "answer": 1,
                        "explain": "A plan sets out what you will do, so emotions do not decide."
                    },
                    {
                        "id": "ld-14",
                        "q": "Why write the plan down?",
                        "options": ["Brokers require it", "It reduces emotional decisions in stressful moments", "It lowers taxes", "It raises returns"],
                        "answer": 1,
                        "explain": "You follow what you decided when calm."
                    },
                    {
                        "id": "ld-15",
                        "q": "Which describes a long-term investor’s view of a market fall?",
                        "options": ["The plan has failed", "Everything must be sold", "A normal part of investing that was planned for", "A sign to borrow more"],
                        "answer": 2,
                        "explain": "Falls are expected, which is why the plan is built to survive them."
                    }
                ]
            }
        },

        {
            "id": "research-and-scams",
            "title": "Researching stocks and spotting scams",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "A simple research routine",
                    "body": [
                        "Before buying a stock, work through the same questions every time. This turns research from a feeling into a routine."
                    ],
                    "bullets": [
                        "What does the company do, and how does it make money?",
                        "Are revenue and profit growing, and is the margin stable?",
                        "How much debt does it carry, and does it generate cash?",
                        "What is the P/E ratio compared with similar companies?",
                        "Does it pay dividends, and are they covered by earnings?",
                        "What are the main risks?"
                    ]
                },
                {
                    "title": "Where to look",
                    "body": [
                        "Use primary sources: the **annual report**, the **earnings report** and the official announcements a listed company must publish. Regulators and the exchange publish rules and notices.",
                        "**Fundamental analysis** studies the business and its value. **Technical analysis** studies price and volume patterns. Many investors use the first to decide what to own and the second for context on timing. Neither can predict the future."
                    ]
                },
                {
                    "title": "Red flags in a company",
                    "body": [
                        "Some patterns deserve extra caution."
                    ],
                    "bullets": [
                        "Falling revenue together with rising debt.",
                        "Reported profits but weak or negative cash flow.",
                        "Delayed or repeatedly revised financial results.",
                        "Concerns raised by the auditor.",
                        "Large dealings with related parties, or unclear explanations.",
                        "A story that depends on hype instead of numbers."
                    ]
                },
                {
                    "title": "How investment scams work",
                    "body": [
                        "Scammers target hope and urgency. The most common patterns share the same signs."
                    ],
                    "bullets": [
                        "**Guaranteed or “risk-free” high returns.** Real investments cannot promise these.",
                        "**Ponzi schemes:** early investors are paid with money from newer investors until the flow stops.",
                        "**Pump and dump:** promoters hype a stock to raise its price, then sell their holdings to those who bought.",
                        "Pressure to act now, secrecy, or rewards for recruiting friends.",
                        "Unlicensed platforms and tips from strangers on social media."
                    ]
                },
                {
                    "title": "Stay safe",
                    "body": [
                        "Check that any broker, platform or fund is registered with the regulator before sending money, using the regulator’s own register rather than a link someone sent you.",
                        "Never share passwords or one-time codes. Be sceptical of anything that sounds too good to be true. If you cannot explain how an investment makes money, do not invest in it. If you think you have met a scam, report it to the regulator."
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "rs-1",
                        "q": "Where should you look for reliable information about a listed company?",
                        "options": ["Anonymous social posts", "Its annual report and official announcements", "A friend’s guess", "Chat group rumours"],
                        "answer": 1,
                        "explain": "Primary documents and official announcements are the most reliable."
                    },
                    {
                        "id": "rs-2",
                        "q": "A company reports profits but has weak cash flow. What should you do?",
                        "options": ["Ignore it", "Treat it as a warning sign worth checking", "Buy more immediately", "Assume it is fine"],
                        "answer": 1,
                        "explain": "Profit that is not backed by cash may not be as strong as it looks."
                    },
                    {
                        "id": "rs-3",
                        "q": "What does fundamental analysis study?",
                        "options": ["Only price charts", "Only the ticker", "The business, its financials and value", "Only volume"],
                        "answer": 2,
                        "explain": "It looks at the company behind the stock."
                    },
                    {
                        "id": "rs-4",
                        "q": "What does technical analysis study?",
                        "options": ["Price and volume patterns", "Annual reports only", "Auditor letters", "Dividend notices"],
                        "answer": 0,
                        "explain": "It uses charts, price and volume data."
                    },
                    {
                        "id": "rs-5",
                        "q": "How is the P/E ratio best used in research?",
                        "options": ["As a guarantee", "Compared with similar companies", "To set the dividend", "To pick a ticker"],
                        "answer": 1,
                        "explain": "Compare like with like for a useful view."
                    },
                    {
                        "id": "rs-6",
                        "q": "Which is a major red flag in an investment offer?",
                        "options": ["A licensed broker", "A prospectus", "A guaranteed high return with no risk", "An annual report"],
                        "answer": 2,
                        "explain": "Real investments cannot guarantee high returns."
                    },
                    {
                        "id": "rs-7",
                        "q": "What is a Ponzi scheme?",
                        "options": ["A type of bond", "A tax rule", "A stock exchange", "Paying earlier investors with money from newer investors"],
                        "answer": 3,
                        "explain": "It collapses when new money stops coming in."
                    },
                    {
                        "id": "rs-8",
                        "q": "What is a pump and dump?",
                        "options": ["Promoters hype a stock, then sell as the price rises", "A dividend payout", "A type of order", "A stock split"],
                        "answer": 0,
                        "explain": "Promoters profit while buyers are left holding the falling stock."
                    },
                    {
                        "id": "rs-9",
                        "q": "What should you check before sending money to a platform?",
                        "options": ["Its adverts", "How many followers it has", "Whether it is registered with the regulator, using the regulator’s own register", "Whether a stranger recommended it"],
                        "answer": 2,
                        "explain": "Verify registration at the source."
                    },
                    {
                        "id": "rs-10",
                        "q": "Which combination is a warning sign in a company?",
                        "options": ["Rising profit and falling debt", "Stable margins", "Falling revenue with rising debt", "Regular dividends covered by earnings"],
                        "answer": 2,
                        "explain": "Shrinking sales and growing borrowing is a risky mix."
                    },
                    {
                        "id": "rs-11",
                        "q": "A stranger on social media gives you a hot stock tip. What should you do?",
                        "options": ["Buy at once", "Verify it independently and be sceptical", "Send them money", "Share your password"],
                        "answer": 1,
                        "explain": "Tips from strangers can be part of a pump and dump."
                    },
                    {
                        "id": "rs-12",
                        "q": "Which is a sign of a scam?",
                        "options": ["Time to read documents", "A licensed salesperson", "A clear fee list", "Pressure to invest right now"],
                        "answer": 3,
                        "explain": "Urgency is used to stop you thinking."
                    },
                    {
                        "id": "rs-13",
                        "q": "Which should you never share with anyone?",
                        "options": ["The ticker of a stock", "Your passwords and one-time codes", "A company’s name", "Your favourite sector"],
                        "answer": 1,
                        "explain": "Passwords and codes give others access to your accounts."
                    },
                    {
                        "id": "rs-14",
                        "q": "Someone offers “risk-free 30% a month”. What is the most sensible view?",
                        "options": ["A great opportunity", "Almost certainly a scam", "A normal bank rate", "A government bond"],
                        "answer": 1,
                        "explain": "Returns like that, with no risk, are not real."
                    },
                    {
                        "id": "rs-15",
                        "q": "What is a good rule before investing?",
                        "options": ["Invest if it sounds exciting", "Invest if others are", "Do not invest in something you cannot explain", "Invest only after a tip"],
                        "answer": 2,
                        "explain": "If you cannot explain how it makes money, you cannot judge its risk."
                    }
                ]
            }
        },

        {
            "id": "building-your-plan",
            "title": "Building your investing plan",
            "minutes": 7,
            "status": "ready",
            "sections": [
                {
                    "title": "Start with goals and time",
                    "body": [
                        "Every plan starts with a question: what is the money for, and when will you need it? A goal with a timeline, such as “₦3,000,000 for a business in five years”, is far easier to plan for than “get rich”.",
                        "Sort goals by horizon. Money needed within a year should stay safe and easy to reach. Money for goals many years away can take more risk."
                    ]
                },
                {
                    "title": "Know your numbers first",
                    "body": [
                        "Before investing, list your income, spending and debts. Build an **emergency fund** that covers several months of expenses, commonly three to six, so a surprise bill never forces you to sell investments.",
                        "Invest only what is left after essentials and your emergency fund."
                    ],
                    "example": {
                        "label": "Example",
                        "text": "If your essential spending is ₦300,000 a month, three months is ₦900,000 and six months is ₦1,800,000."
                    }
                },
                {
                    "title": "Choose your mix and build it",
                    "body": [
                        "Set your target **asset allocation** from your goals, horizon and tolerance. Then build it with a diversified core, such as a spread of companies and sectors, or funds that hold many securities.",
                        "Add position limits so no one holding can sink you, and count the costs of every choice, including fees, spreads, currency and tax."
                    ],
                    "bullets": [
                        "Decide how much goes in shares, bonds and cash.",
                        "Cap any single stock and any single sector.",
                        "Consider both NGX and US markets for spread.",
                        "Invest regularly, for example monthly."
                    ]
                },
                {
                    "title": "Monitor without over-reacting",
                    "body": [
                        "Review on a schedule, such as every quarter or once a year. Compare results with a fair **benchmark**, check for drift, and rebalance if you have moved far from target.",
                        "Keep a journal of why you bought each holding. When prices move, ask whether the reason has changed, not only whether the price has."
                    ]
                },
                {
                    "title": "When to sell, and a final checklist",
                    "body": [
                        "Good reasons to sell include a broken reason for owning, a need to rebalance, a goal that needs funding, or a better use for the money. Poor reasons include a one-day drop or a scary headline.",
                        "Use this checklist for every decision."
                    ],
                    "bullets": [
                        "Is this aligned with my goal and horizon?",
                        "Do I understand how it makes money, and what can go wrong?",
                        "How big is the position compared with my limit?",
                        "What are the total costs, including tax?",
                        "What would make me sell, decided in advance?"
                    ]
                }
            ],
            "sources": [
                { "label": "Investor.gov (US SEC)", "url": "https://www.investor.gov/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    {
                        "id": "bp-1",
                        "q": "What is the first step in building an investing plan?",
                        "options": ["Picking a hot stock", "Defining your goals and time horizon", "Borrowing money", "Checking social media"],
                        "answer": 1,
                        "explain": "Everything else depends on what the money is for and when you need it."
                    },
                    {
                        "id": "bp-2",
                        "q": "What is the purpose of an emergency fund?",
                        "options": ["To speculate", "To pay broker fees", "To cover unexpected costs without selling investments", "To buy a stock"],
                        "answer": 2,
                        "explain": "It stops you being forced to sell at a bad moment."
                    },
                    {
                        "id": "bp-3",
                        "q": "Essential spending is ₦300,000 a month. How much is a 3-month emergency fund?",
                        "options": ["₦100,000", "₦3,000,000", "₦600,000", "₦900,000"],
                        "answer": 3,
                        "explain": "3 × ₦300,000 = ₦900,000."
                    },
                    {
                        "id": "bp-4",
                        "q": "With the same spending, how much is a 6-month emergency fund?",
                        "options": ["₦1,800,000", "₦1,200,000", "₦600,000", "₦3,600,000"],
                        "answer": 0,
                        "explain": "6 × ₦300,000 = ₦1,800,000."
                    },
                    {
                        "id": "bp-5",
                        "q": "Which is a good reason to sell?",
                        "options": ["A scary headline", "The original reason for owning it no longer holds", "A friend’s opinion", "The price dropped for one day"],
                        "answer": 1,
                        "explain": "Selling should follow from your reasons, not from noise."
                    },
                    {
                        "id": "bp-6",
                        "q": "Which is a poor reason to sell?",
                        "options": ["You need to rebalance", "A goal needs funding", "The thesis for owning it broke", "The price fell sharply for one day on a rumour"],
                        "answer": 3,
                        "explain": "Short-term moves and rumours are not a reason on their own."
                    },
                    {
                        "id": "bp-7",
                        "q": "Why set a cap on any single stock?",
                        "options": ["To limit the damage if that one stock fails", "To guarantee profit", "To lower taxes", "To raise dividends"],
                        "answer": 0,
                        "explain": "A cap limits how far one mistake can reach."
                    },
                    {
                        "id": "bp-8",
                        "q": "How often should you review your plan?",
                        "options": ["Every minute", "Never", "On a regular schedule, such as quarterly or yearly", "Only after a crash"],
                        "answer": 2,
                        "explain": "A schedule keeps you disciplined without constant tinkering."
                    },
                    {
                        "id": "bp-9",
                        "q": "When should you rebalance?",
                        "options": ["When your mix has drifted far from target", "Every day", "Only when prices rise", "Never"],
                        "answer": 0,
                        "explain": "Rebalancing restores your intended level of risk."
                    },
                    {
                        "id": "bp-10",
                        "q": "Why keep a journal of why you bought each holding?",
                        "options": ["It sets prices", "It avoids tax", "It guarantees profit", "You can check whether the reason has changed"],
                        "answer": 3,
                        "explain": "Reviewing your reasons helps you decide whether to hold or sell."
                    },
                    {
                        "id": "bp-11",
                        "q": "What is a diversified core?",
                        "options": ["One favourite stock", "A spread of companies and sectors, or funds holding many securities", "All cash", "Borrowed money"],
                        "answer": 1,
                        "explain": "A broad base spreads risk."
                    },
                    {
                        "id": "bp-12",
                        "q": "Which belongs in an investing plan?",
                        "options": ["A promised return", "Goals, target mix, risk limits and a review schedule", "Daily price predictions", "Rumours"],
                        "answer": 1,
                        "explain": "The plan records what you will do and when."
                    },
                    {
                        "id": "bp-13",
                        "q": "What should you consider when choosing investments?",
                        "options": ["Only the headline return", "Only the ticker", "The total costs, including fees, currency and tax", "Only friends’ choices"],
                        "answer": 2,
                        "explain": "Costs reduce what you keep."
                    },
                    {
                        "id": "bp-14",
                        "q": "Money you will need within a year should be…",
                        "options": ["Kept low-risk and easy to reach", "Put into one volatile stock", "Borrowed against", "Locked into a risky bet"],
                        "answer": 0,
                        "explain": "Short horizons leave no time to recover from a fall."
                    },
{
    "id": "bp-15",
    "q": "Your holdings are 80% in one bank stock, you have no emergency fund, and a friend tips a new stock. What is the best first step?",
    "options": ["Buy the tip with your savings", "Build an emergency fund and reduce the single-stock concentration before adding risk", "Sell everything", "Borrow to buy both"],
    "answer": 1,
    "explain": "Safety and diversification come before chasing new ideas."
}
                ]
            }
        }
    ]
},

/* ============================================
   MARKET HISTORY LESSONS: drop-in track
   Put this object right after "investor-mindset" (the last track).
   Remove the trailing comma if it is the last item in the array.
   3 lessons, 15 questions each (5 asked per try).
   Figures were checked against NSE/NGX, CBN and press reports and
   are rounded on purpose. Re-verify before publishing.
   ============================================ */
{
    "id": "market-history",
    "title": "Market History Lessons",
    "summary": "What 2008, 2020 and 2023 teach about risk.",
    "level": "All levels",
    "theme": "indigo",
    "icon": "fa-clock-rotate-left",
    "lessons": [
        {
            "id": "the-2008-crash",
            "title": "2008–2009: the boom and the crash",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "The boom",
                    "body": [
                        "Between 2005 and early 2008, Nigerian stocks soared. The All-Share Index climbed from about 24,000 at the end of 2005 to a record near 66,000 in March 2008. Bank share offers raised huge sums, new investors poured in, and many people borrowed to buy shares.",
                        "Banks made up a very large part of the market, so the index depended heavily on them."
                    ]
                },
                {
                    "title": "The crash",
                    "body": [
                        "The turn came in 2008. The global financial crisis hit, oil prices fell, foreign investors pulled out, and people who had borrowed to buy shares were forced to sell. The All-Share Index lost roughly two-thirds of its value by early 2009, falling to around 20,000.",
                        "Many investors who had bought near the top, especially with borrowed money, lost much of what they put in."
                    ]
                },
                {
                    "title": "The long recovery",
                    "body": [
                        "The index took about **15 years** to climb back above its 2008 peak, which it did in 2023. A single stock’s story can be worse. Some companies never recovered their old prices at all.",
                        "Remember too that an index recovering does not mean every investor recovered. Someone who sold near the bottom locked in the loss."
                    ],
                    "example": {
                        "label": "The maths of recovery",
                        "text": "A fall of about 67% needs a rise of about 200% to get back to the starting level. A ₦100 share that falls to ₦33 must triple, not just rise 67%."
                    }
                },
                {
                    "title": "What it teaches",
                    "bullets": [
                        "**Booms end.** Rapid rises, easy money and “everyone is buying” are warning signs, not reasons to join.",
                        "**Borrowing magnifies pain.** Margin loans forced selling at the worst time.",
                        "**Concentration is risky.** A market dominated by one sector falls hard when that sector does.",
                        "**Time matters.** Money you will need soon does not belong in a boom.",
                        "**Prices can be wrong for a long time**, in both directions."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Believing “it is different this time” at the peak, and believing “it will never come back” at the bottom."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "How much of my portfolio is in one sector?",
                        "Am I investing with borrowed money?",
                        "How have prices moved compared with company earnings?",
                        "Could I hold through a 50% fall without being forced to sell?",
                        "Do I have a plan decided before the panic?"
                    ]
                }
            ],
            "sources": [
                { "label": "SEC Nigeria", "url": "https://sec.gov.ng/" },
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "h8-1", "q": "Roughly when did the Nigerian All-Share Index reach its 2008 peak?", "options": ["March 2008", "January 2003", "December 2012", "June 2020"], "answer": 0, "explain": "The index peaked in early March 2008 near 66,000." },
                    { "id": "h8-2", "q": "About how much of its value did the All-Share Index lose by early 2009?", "options": ["About 5%", "About 20%", "Roughly two-thirds", "Nothing"], "answer": 2, "explain": "It fell from about 66,000 to around 20,000." },
                    { "id": "h8-3", "q": "Which of these helped fuel the boom?", "options": ["Falling oil prices", "Easy money, big share offers and borrowing to buy shares", "A ban on trading", "Falling bank profits"], "answer": 1, "explain": "Optimism and credit pushed prices up quickly." },
                    { "id": "h8-4", "q": "Why did borrowing to buy shares make the crash worse?", "options": ["Borrowers could never lose", "It lowered prices", "It guaranteed profit", "Lenders demanded repayment, forcing sales at low prices"], "answer": 3, "explain": "Forced selling pushed prices down further." },
                    { "id": "h8-5", "q": "About how long did the index take to recover above its 2008 peak?", "options": ["One year", "Three years", "About 15 years", "Never"], "answer": 2, "explain": "It passed the old peak in 2023." },
                    { "id": "h8-6", "q": "A share falls 67%. What gain is needed to return to the starting price, roughly?", "options": ["67%", "100%", "150%", "About 200%"], "answer": 3, "explain": "₦100 falls to ₦33, and must rise about 203% to get back." },
                    { "id": "h8-7", "q": "Why did the market’s heavy dependence on banks matter?", "options": ["Banks are never risky", "Banks do not trade", "A fall in banks dragged down the whole index", "It made the market safer"], "answer": 2, "explain": "Concentration in one sector made the index more fragile." },
                    { "id": "h8-8", "q": "An index recovers to its old level. Did every investor recover?", "options": ["Yes", "No, those who sold low locked in losses and some stocks never recovered", "Yes, automatically", "Only on the NGX"], "answer": 1, "explain": "Individual outcomes depend on what you owned and when you sold." },
                    { "id": "h8-9", "q": "What is a lesson about market booms?", "options": ["They last forever", "Rapid rises and crowd excitement are warning signs", "Borrowing makes them safer", "Only banks can rise"], "answer": 1, "explain": "Euphoria is when risk is highest." },
                    { "id": "h8-10", "q": "Which investor was probably hurt least in a sharp crash?", "options": ["One who borrowed heavily", "One who needed the money next month", "One who put everything into one sector", "One with diversified holdings and money they did not need soon"], "answer": 3, "explain": "Diversification and a long horizon reduce forced selling." },
                    { "id": "h8-11", "q": "What does “it is different this time” usually signal?", "options": ["Careful analysis", "A reliable rule", "Overconfidence at a market peak", "A tax change"], "answer": 2, "explain": "Investors often dismiss history just before a reversal." },
                    { "id": "h8-12", "q": "Why is margin lending risky for a small investor?", "options": ["It removes losses", "A falling market can force you to sell at the worst time", "It lowers fees", "It guarantees returns"], "answer": 1, "explain": "Lenders can demand repayment when prices drop." },
                    { "id": "h8-13", "q": "A ₦100 share falls to ₦33. To get back to ₦100 it must roughly…", "options": ["Triple", "Rise 67%", "Rise 10%", "Double"], "answer": 0, "explain": "₦33 × 3 is about ₦100." },
                    { "id": "h8-14", "q": "Which question protects you from a boom-and-bust?", "options": ["How can I borrow more?", "Could I hold through a 50% fall without being forced to sell?", "What is everyone else buying?", "What is the highest price ever?"], "answer": 1, "explain": "Being able to hold through falls prevents panic selling." },
                    { "id": "h8-15", "q": "What does the 2008 crash show about prices?", "options": ["They are always right", "They can stay far from value for a long time, in both directions", "They never fall", "They are set by the government"], "answer": 1, "explain": "Markets overshoot up and down." }
                ]
            }
        },

        {
            "id": "the-2020-covid-and-oil-shock",
            "title": "2020: the pandemic, oil shock and rebound",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "A sudden fall",
                    "body": [
                        "In early 2020 the COVID-19 pandemic spread and the oil price collapsed, partly because of a price war between big producers. Nigeria depends heavily on oil for government income and foreign currency, so it was hit twice.",
                        "In the first quarter the All-Share Index lost about 20% of its value, and some sectors, such as consumer goods and banking, fell even more."
                    ]
                },
                {
                    "title": "A strong rebound",
                    "body": [
                        "Then came a surprise. The market recovered, and the All-Share Index ended 2020 up about **50%**, one of the best results in the world that year. In dollar terms the gain was smaller, because the naira weakened."
                    ],
                    "example": {
                        "label": "Think about it",
                        "text": "An investor who panicked in March 2020 and sold turned a temporary fall of about 20% into a permanent loss, and missed a rise of around 50% over the year."
                    }
                },
                {
                    "title": "Why did it rebound?",
                    "body": [
                        "Interest rates on safe government securities fell sharply, so investors with cash looked for better returns and moved into stocks. Local investors drove much of the buying, and strong company results helped some sectors.",
                        "Not everything rose. Several sectors, including oil and gas and consumer goods, finished the year lower. A rising index can hide big differences between stocks."
                    ]
                },
                {
                    "title": "What it teaches",
                    "bullets": [
                        "**Falls can be fast and recoveries can be fast**, so selling in panic is costly.",
                        "**Interest rates shape where money goes.** Low safe yields push money toward shares.",
                        "**Know your sector exposure.** Oil, consumer goods and banks behaved differently.",
                        "**Currency matters.** A 50% naira gain was a smaller gain in dollars.",
                        "**No one predicted either the fall or the rebound.**"
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Assuming the last few weeks tell you what comes next. Early 2020 looked like the start of a long bear market. It was followed by one of the best years in decades."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "What is driving this fall: temporary shock or damaged earnings?",
                        "What are safe yields doing, and where could money flow?",
                        "How exposed is each holding to oil, imports or the currency?",
                        "Do I have cash so I am not forced to sell?",
                        "Am I acting on my plan, or on fear?"
                    ]
                }
            ],
            "sources": [
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" },
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "h2-1", "q": "Which two shocks hit Nigerian stocks in early 2020?", "options": ["A tax cut and a rate rise", "The pandemic and an oil price collapse", "A bank merger and a holiday", "Inflation falling and a new index"], "answer": 1, "explain": "COVID-19 and the oil price crash combined." },
                    { "id": "h2-2", "q": "Why was Nigeria especially exposed to the oil price fall?", "options": ["It has no oil", "It depends heavily on oil for government income and foreign currency", "It only exports bonds", "Oil is not traded"], "answer": 1, "explain": "Oil revenue underpins public finances and dollar supply." },
                    { "id": "h2-3", "q": "About how much did the All-Share Index lose in the first quarter of 2020?", "options": ["Roughly 20%", "About 1%", "Roughly 70%", "It rose"], "answer": 0, "explain": "The fall was around 20% in the quarter." },
                    { "id": "h2-4", "q": "Roughly how did the All-Share Index finish 2020?", "options": ["Down 50%", "Up about 50%", "Unchanged", "Down 20%"], "answer": 1, "explain": "A strong rebound left it up about 50% for the year." },
                    { "id": "h2-5", "q": "Why was the dollar-terms gain smaller than the naira gain?", "options": ["Dollars pay no dividends", "The naira weakened", "NGX prices are in dollars", "Taxes rose"], "answer": 1, "explain": "A weaker naira reduces gains when measured in dollars." },
                    { "id": "h2-6", "q": "An investor sold everything in March 2020 after a 20% fall. What happened to them?", "options": ["They locked in the loss and missed the rebound", "They profited from the rebound", "They avoided all risk forever", "They received a dividend"], "answer": 0, "explain": "Selling at the bottom turns a temporary fall into a permanent loss." },
                    { "id": "h2-7", "q": "What helped push money into stocks in 2020?", "options": ["Higher yields on government securities", "A ban on bonds", "Sharply lower yields on safe securities", "Rising oil prices only"], "answer": 2, "explain": "With safe returns low, investors looked elsewhere." },
                    { "id": "h2-8", "q": "Did every sector rise in 2020?", "options": ["Yes", "Yes, all banks rose", "Only oil rose", "No, some, such as oil and gas, finished lower"], "answer": 3, "explain": "A rising index can hide differences between sectors." },
                    { "id": "h2-9", "q": "What does 2020 show about predicting markets?", "options": ["It is easy", "Neither the fall nor the rebound was widely predicted", "Charts always work", "Prices never change"], "answer": 1, "explain": "Surprises are normal, so plans matter more than forecasts." },
                    { "id": "h2-10", "q": "Why does a safe-yield drop matter to stocks?", "options": ["It cancels dividends", "It makes bonds more attractive", "It can push investors toward shares in search of returns", "It sets share prices"], "answer": 2, "explain": "Lower safe returns make equities relatively attractive." },
                    { "id": "h2-11", "q": "What is a good first question after a sharp fall?", "options": ["Is this a temporary shock or damage to earnings?", "How do I sell everything?", "What did strangers post?", "Who else is panicking?"], "answer": 0, "explain": "Understanding the cause guides the response." },
                    { "id": "h2-12", "q": "A share falls 20%. What gain brings it back to the starting price?", "options": ["20%", "10%", "25%", "40%"], "answer": 2, "explain": "₦100 becomes ₦80, and ₦80 must rise 25% to return to ₦100." },
                    { "id": "h2-13", "q": "Why hold some cash during turbulent times?", "options": ["Cash always grows fastest", "So you are not forced to sell investments at a bad price", "Banks require it", "To avoid all tax"], "answer": 1, "explain": "A cash buffer prevents panic selling." },
                    { "id": "h2-14", "q": "Which statement is correct?", "options": ["A fast fall means a fast recovery always follows", "Recoveries never happen", "Recent weeks tell you exactly what comes next", "Falls and rebounds can both be fast, and neither is reliably predictable"], "answer": 3, "explain": "Markets can swing both ways quickly." },
                    { "id": "h2-15", "q": "What does this episode teach about sector exposure?", "options": ["All sectors behave the same", "Different sectors can behave very differently in the same year", "Only banks matter", "Sectors are irrelevant"], "answer": 1, "explain": "Know what drives each holding." }
                ]
            }
        },

        {
            "id": "the-2023-naira-reform",
            "title": "2023: the naira reform and high inflation",
            "minutes": 6,
            "status": "ready",
            "sections": [
                {
                    "title": "The exchange-rate shock",
                    "body": [
                        "For years the CBN ran several exchange-rate windows, and the official rate was much stronger than the rate at which people could really buy dollars. In June 2023 it merged the windows and let the market set the rate. Within days the official rate moved from about ₦460 to roughly ₦750 per dollar.",
                        "The naira kept weakening afterwards. Imports became more expensive, and inflation climbed to very high levels in the following months."
                    ]
                },
                {
                    "title": "What happened to stocks",
                    "body": [
                        "Nigerian shares rose strongly in naira terms in both 2023 and 2024. The All-Share Index gained about 38% in 2024 alone. Part of the reason was that investors wanted assets that could keep up with inflation and a falling currency, and safe yields looked weak next to inflation.",
                        "Measured in dollars, the gains were far smaller, because the naira fell so much."
                    ],
                    "example": {
                        "label": "Nominal against real",
                        "text": "Imagine a stock that rises 40% in a year while inflation is 30%. The real gain is about 8% (1.40 ÷ 1.30 - 1). Convert to dollars with a currency that fell 35%, and it may be a loss."
                    }
                },
                {
                    "title": "Who was hurt, who gained",
                    "bullets": [
                        "**Savers in cash and low-yield accounts** lost buying power.",
                        "**Importers and firms with dollar debt** faced higher costs.",
                        "**Dollar earners** gained in naira terms.",
                        "**Foreign investors** saw their naira gains shrink in dollars."
                    ]
                },
                {
                    "title": "What it teaches",
                    "bullets": [
                        "**Look at real returns**, not only naira returns.",
                        "**Currency risk is real.** Check the return in the currency your goals use.",
                        "**Policy changes can reset prices overnight.**",
                        "**Rising prices alone can lift stock prices** without making companies better.",
                        "**Savings that do not beat inflation lose buying power**, however safe they feel."
                    ]
                },
                {
                    "title": "Common mistake",
                    "body": [
                        "Celebrating a big naira return without asking what inflation and the exchange rate did. A rising number is not always rising wealth."
                    ]
                },
                {
                    "title": "What experts check",
                    "bullets": [
                        "My return after inflation.",
                        "My return in dollars, if I have dollar goals or costs.",
                        "Which holdings benefit from, or suffer under, a weaker naira.",
                        "Whether my savings earn more than inflation.",
                        "Which policy changes could change prices suddenly."
                    ]
                }
            ],
            "sources": [
                { "label": "Central Bank of Nigeria", "url": "https://www.cbn.gov.ng/" },
                { "label": "Nigerian Exchange (NGX)", "url": "https://ngxgroup.com/" }
            ],
            "check": {
                "perSession": 5,
                "passMark": 4,
                "questions": [
                    { "id": "h3-1", "q": "What did the CBN do in June 2023?", "options": ["Closed the exchange", "Merged its exchange-rate windows and let the market set the rate", "Banned dollars", "Cut taxes"], "answer": 1, "explain": "It unified the windows, moving toward a market-determined rate." },
                    { "id": "h3-2", "q": "Roughly how did the official rate move within days of the change?", "options": ["From ₦460 to about ₦750 per dollar", "From ₦750 to ₦460", "It did not move", "From ₦1 to ₦2"], "answer": 0, "explain": "The official rate caught up with the parallel market." },
                    { "id": "h3-3", "q": "Before June 2023, why was the official rate misleading?", "options": ["It was far stronger than the rate at which dollars were really available", "It was far weaker than reality", "It was fixed at ₦1", "It did not exist"], "answer": 0, "explain": "Many people could not buy dollars at the official rate." },
                    { "id": "h3-4", "q": "What happened to import costs as the naira weakened?", "options": ["They fell", "They stayed the same", "They rose", "They vanished"], "answer": 2, "explain": "Each dollar of imports cost more naira." },
                    { "id": "h3-5", "q": "What happened to Nigerian shares in naira terms in 2023 and 2024?", "options": ["They fell sharply", "They rose strongly", "They were closed", "They were unchanged"], "answer": 1, "explain": "The index gained strongly in both years." },
                    { "id": "h3-6", "q": "Why were gains smaller in dollar terms?", "options": ["Dollar prices rose", "Taxes", "The naira weakened a lot", "Brokers charge in dollars"], "answer": 2, "explain": "A falling currency erodes gains measured in dollars." },
                    { "id": "h3-7", "q": "A stock rises 40% while inflation is 30%. What is the real gain, roughly?", "options": ["70%", "10%", "About 8%", "40%"], "answer": 2, "explain": "1.40 ÷ 1.30 - 1 is about 7.7%." },
                    { "id": "h3-8", "q": "Why might investors move into shares when inflation is very high?", "options": ["Shares never fall", "They hope to beat inflation, which safe yields did not", "Bonds are illegal", "Shares are guaranteed"], "answer": 1, "explain": "Investors look for assets that may keep up with rising prices." },
                    { "id": "h3-9", "q": "Which group is usually hurt by a sharp naira fall?", "options": ["Dollar earners", "Importers and companies with dollar debt", "People holding dollars", "Exporters"], "answer": 1, "explain": "Their costs or debts rise in naira." },
                    { "id": "h3-10", "q": "Why can savings in a low-yield account lose value in high inflation?", "options": ["Banks take it", "Interest is illegal", "Prices rise faster than the interest earned", "Savings accounts are taxed at 100%"], "answer": 2, "explain": "Buying power falls when inflation beats the interest rate." },
                    { "id": "h3-11", "q": "What should you check after a big naira return?", "options": ["Only the headline", "What inflation and the exchange rate did", "Nothing", "The ticker"], "answer": 1, "explain": "Nominal gains can hide real or dollar losses." },
                    { "id": "h3-12", "q": "Can rising prices lift stock prices without improving companies?", "options": ["Yes, inflation can push nominal prices up", "No, never", "Only for banks", "Only in dollars"], "answer": 0, "explain": "In inflation, many nominal prices rise together." },
                    { "id": "h3-13", "q": "Which return is most relevant to someone with dollar goals?", "options": ["Return in naira only", "Return in dollars", "The ticker’s age", "Last month’s volume"], "answer": 1, "explain": "Goals in dollars call for dollar-based comparison." },
                    { "id": "h3-14", "q": "What does 2023 show about policy decisions?", "options": ["They never affect prices", "They are announced a year ahead", "They can reset prices very quickly", "They only affect bonds"], "answer": 2, "explain": "A single announcement moved the exchange rate sharply." },
                    { "id": "h3-15", "q": "Which approach is best after learning these lessons?", "options": ["Judge returns only in naira", "Look at returns after inflation and, where relevant, in dollars", "Ignore inflation", "Avoid all investing"], "answer": 1, "explain": "Real returns show what you can actually buy." }
                ]
            }
        }
    ]
}


    ]
};
