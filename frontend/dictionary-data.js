/* ============================================
   GAZE INVESTING DICTIONARY — DATA
   ============================================ */

window.GAZE_DICTIONARY = {
    version: 1,

    terms: [

        /* ============================================
           MARKET BASICS
           ============================================ */

        {
            term: "Stock",
            category: "Market Basics",
            level: "Beginner",
            definition: "A unit of ownership in a company.",
            simpleExplanation: "When you own a stock, you own a small piece of the company.",
            example: "If you buy 10 shares of GTCO, you own a small portion of GTCO.",
            whyItMatters: "Stocks are the basic building blocks of stock-market investing.",
            related: ["Share", "Equity", "Shareholder", "Company"]
        },

        {
            term: "Share",
            category: "Market Basics",
            level: "Beginner",
            definition: "A single unit of ownership in a company.",
            simpleExplanation: "Think of a company as being divided into many small pieces. Each piece is a share.",
            example: "If a company has 1 billion shares and you own 1,000, you own 1,000 of those pieces.",
            whyItMatters: "Your number of shares determines how much of a company you own.",
            related: ["Stock", "Equity", "Shareholder"]
        },

        {
            term: "Equity",
            category: "Market Basics",
            level: "Beginner",
            definition: "Ownership interest in a company.",
            simpleExplanation: "Equity is another way of describing ownership in a business.",
            example: "Buying ordinary shares gives you equity in the company.",
            whyItMatters: "Equity investing means putting money into businesses in exchange for ownership.",
            related: ["Stock", "Share", "Shareholder"]
        },

        {
            term: "Shareholder",
            category: "Market Basics",
            level: "Beginner",
            definition: "A person or organization that owns shares in a company.",
            simpleExplanation: "If you own shares, you are a shareholder.",
            example: "Someone holding 100 shares of a listed company is a shareholder of that company.",
            whyItMatters: "Shareholders can benefit when the value of their investment rises and may receive dividends.",
            related: ["Share", "Stock", "Dividend"]
        },

        {
            term: "Investor",
            category: "Market Basics",
            level: "Beginner",
            definition: "A person or organization that puts money into an asset with the expectation of receiving a return.",
            simpleExplanation: "An investor puts money to work today hoping it becomes more valuable over time.",
            example: "Someone buying shares and holding them for several years is investing.",
            whyItMatters: "Understanding the investor mindset helps you focus on long-term decisions rather than short-term noise.",
            related: ["Portfolio", "Return", "Investment"]
        },

        {
            term: "Trader",
            category: "Market Basics",
            level: "Beginner",
            definition: "A person who buys and sells financial assets, often with a shorter-term focus.",
            simpleExplanation: "Traders usually focus more on price movements and opportunities over shorter periods.",
            example: "A trader may buy a stock today and sell it a few days later.",
            whyItMatters: "Trading and investing have different goals, time horizons and risks.",
            related: ["Trading", "Investor", "Day Trading", "Swing Trading"]
        },

        {
            term: "Stock Exchange",
            category: "Market Basics",
            level: "Beginner",
            definition: "A regulated marketplace where securities such as stocks can be traded.",
            simpleExplanation: "It is the organized marketplace where buyers and sellers trade listed securities.",
            example: "The Nigerian Exchange is a stock exchange.",
            whyItMatters: "Understanding exchanges helps you understand where stock transactions take place.",
            related: ["NGX", "NYSE", "NASDAQ", "Broker"]
        },

        {
            term: "NGX",
            category: "Market Basics",
            level: "Beginner",
            definition: "The Nigerian Exchange, Nigeria's primary securities exchange.",
            simpleExplanation: "NGX is the major Nigerian marketplace where listed companies' shares are traded.",
            example: "GTCO and other Nigerian listed companies have shares traded on the NGX.",
            whyItMatters: "It is especially important for investors researching Nigerian stocks.",
            related: ["Stock Exchange", "Ticker", "Nigerian Stocks"]
        },

        {
            term: "Broker",
            category: "Market Basics",
            level: "Beginner",
            definition: "A regulated intermediary that helps investors buy and sell securities.",
            simpleExplanation: "A broker provides the service that connects you to the market so you can place trades.",
            example: "You may use a broker's platform to submit an order for a stock.",
            whyItMatters: "Most individual investors access markets through brokers rather than directly through an exchange.",
            related: ["Order", "Stock Exchange", "Market Order"]
        },

        {
            term: "Ticker",
            category: "Market Basics",
            level: "Beginner",
            definition: "A short symbol used to identify a publicly traded security.",
            simpleExplanation: "A ticker is the stock's short market name.",
            example: "GTCO is the ticker commonly used to identify Guaranty Trust Holding Company on the NGX.",
            whyItMatters: "Tickers make it easier to search for and identify stocks.",
            related: ["Stock", "Symbol", "Exchange"]
        },

        {
            term: "Market Capitalization",
            category: "Market Basics",
            level: "Beginner",
            definition: "The total market value of a company's outstanding shares.",
            simpleExplanation: "It estimates how much the market values the entire company.",
            example: "If a company has 1 billion shares trading at ₦20 each, its market capitalization is ₦20 billion.",
            whyItMatters: "It helps investors compare the size of different companies.",
            related: ["Share", "Stock Price", "Large Cap", "Small Cap"]
        },

        {
            term: "Index",
            category: "Market Basics",
            level: "Beginner",
            definition: "A measurement designed to track the performance of a group of securities.",
            simpleExplanation: "An index gives you a way to see how a group of stocks is performing.",
            example: "An index may track a group of major companies on an exchange.",
            whyItMatters: "Indexes help investors understand broader market performance.",
            related: ["Market", "Sector", "Benchmark"]
        },

        {
            term: "Sector",
            category: "Market Basics",
            level: "Beginner",
            definition: "A broad category of companies that operate in a similar area of the economy.",
            simpleExplanation: "A sector groups businesses based on what part of the economy they operate in.",
            example: "Banking, telecommunications and consumer goods can be different sectors.",
            whyItMatters: "Sector knowledge helps you understand where your portfolio is concentrated.",
            related: ["Industry", "Diversification", "Portfolio"]
        },

        {
            term: "Industry",
            category: "Market Basics",
            level: "Beginner",
            definition: "A narrower group of companies involved in similar business activities.",
            simpleExplanation: "An industry is a more specific business category within the broader economy.",
            example: "Commercial banking is an industry within the broader financial sector.",
            whyItMatters: "Comparing companies within the same industry can make analysis more meaningful.",
            related: ["Sector", "Company", "Competition"]
        },


        /* ============================================
           BUYING & SELLING
           ============================================ */

        {
            term: "Order",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "An instruction to buy or sell a security.",
            simpleExplanation: "An order tells your broker what you want to do in the market.",
            example: "You can submit an order to buy 100 shares.",
            whyItMatters: "Different order types can affect the price and conditions under which your trade executes.",
            related: ["Market Order", "Limit Order", "Execution"]
        },

        {
            term: "Market Order",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "An order to buy or sell a security at the best available price in the market.",
            simpleExplanation: "You are prioritizing getting the trade executed rather than specifying an exact price.",
            example: "You place a market order to buy shares and accept the available market price.",
            whyItMatters: "Market orders can execute quickly, but the final price may differ from the price you saw before submitting the order.",
            related: ["Order", "Limit Order", "Execution", "Slippage"]
        },

        {
            term: "Limit Order",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "An order to buy or sell a security only at a specified price or better.",
            simpleExplanation: "You set the price you are willing to accept.",
            example: "You could place a limit order to buy a stock at ₦50 or lower.",
            whyItMatters: "Limit orders give you more control over price, although execution is not guaranteed.",
            related: ["Order", "Market Order", "Bid", "Ask"]
        },

        {
            term: "Bid",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "The highest price a buyer is currently willing to pay for a security.",
            simpleExplanation: "The bid is the price buyers are offering.",
            example: "If the highest buyer is offering ₦100, the current bid is ₦100.",
            whyItMatters: "The bid helps show current buying demand.",
            related: ["Ask", "Spread", "Order Book"]
        },

        {
            term: "Ask",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "The lowest price a seller is currently willing to accept for a security.",
            simpleExplanation: "The ask is the price sellers are requesting.",
            example: "If the lowest seller is asking ₦102, the current ask is ₦102.",
            whyItMatters: "The ask helps show current selling supply.",
            related: ["Bid", "Spread", "Order Book"]
        },

        {
            term: "Bid-Ask Spread",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "The difference between the highest bid and lowest ask.",
            simpleExplanation: "It is the gap between what buyers offer and sellers want.",
            example: "If the bid is ₦100 and the ask is ₦102, the spread is ₦2.",
            whyItMatters: "A large spread can make trading more expensive and may indicate lower liquidity.",
            related: ["Bid", "Ask", "Liquidity"]
        },

        {
            term: "Liquidity",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "How easily an asset can be bought or sold without causing a large price change.",
            simpleExplanation: "A liquid stock generally has enough buyers and sellers for trades to happen easily.",
            example: "A heavily traded stock is usually more liquid than a rarely traded stock.",
            whyItMatters: "Low liquidity can make entering or leaving a position more difficult.",
            related: ["Volume", "Spread", "Slippage"]
        },

        {
            term: "Volume",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "The number of shares or units traded during a specific period.",
            simpleExplanation: "Volume tells you how much trading activity took place.",
            example: "If 2 million shares change hands during a trading session, volume is 2 million shares.",
            whyItMatters: "Volume can help show how active a stock is and can provide context for price movements.",
            related: ["Liquidity", "Trading", "Price"]
        },

        {
            term: "Execution",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "The completion of a buy or sell order.",
            simpleExplanation: "Your order is executed when the market actually completes the trade.",
            example: "You submit an order to buy 100 shares and another participant sells those shares to you.",
            whyItMatters: "Submitting an order does not always mean the trade has been completed.",
            related: ["Order", "Fill", "Partial Fill"]
        },

        {
            term: "Fill",
            category: "Buying & Selling",
            level: "Beginner",
            definition: "A completed transaction resulting from an order.",
            simpleExplanation: "A fill means some or all of your order was successfully traded.",
            example: "A 100-share order that trades completely has a full fill.",
            whyItMatters: "Understanding fills helps you know whether your order actually traded.",
            related: ["Execution", "Partial Fill", "Order"]
        },

        {
            term: "Partial Fill",
            category: "Buying & Selling",
            level: "Intermediate",
            definition: "When only part of an order is executed.",
            simpleExplanation: "You asked to trade a certain amount, but only some of it was matched.",
            example: "You request 1,000 shares but only 400 are available at your specified price.",
            whyItMatters: "Partial fills are especially relevant when trading less-liquid securities.",
            related: ["Fill", "Liquidity", "Limit Order"]
        },

        {
            term: "Slippage",
            category: "Buying & Selling",
            level: "Intermediate",
            definition: "The difference between the expected trade price and the actual execution price.",
            simpleExplanation: "You expected one price but the trade happened at a different price.",
            example: "You expected to buy at ₦100 but the order executes at ₦101.",
            whyItMatters: "Slippage can increase the actual cost of a trade.",
            related: ["Liquidity", "Market Order", "Spread"]
        },


        /* ============================================
           PRICE & MARKET MOVEMENT
           ============================================ */

        {
            term: "Stock Price",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The current market price at which a share can be traded.",
            simpleExplanation: "It is the price the market is currently assigning to a share.",
            example: "If a stock is trading at ₦50, the quoted price is ₦50 per share.",
            whyItMatters: "Price is one part of evaluating an investment, but price alone does not tell you whether a stock is cheap or expensive.",
            related: ["Market Capitalization", "Valuation", "Volume"]
        },

        {
            term: "Bull Market",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A market environment characterized by broadly rising prices and optimistic sentiment.",
            simpleExplanation: "A bull market is a period when markets are generally moving upward.",
            example: "Major indexes rising strongly over an extended period may be described as a bull market.",
            whyItMatters: "Market conditions affect investor expectations and risk.",
            related: ["Bear Market", "Rally", "Trend"]
        },

        {
            term: "Bear Market",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A market environment characterized by broadly falling prices and pessimistic sentiment.",
            simpleExplanation: "A bear market is a period when markets are generally moving downward.",
            example: "A sustained major decline in a broad market index may be described as a bear market.",
            whyItMatters: "Bear markets test risk management and investor discipline.",
            related: ["Bull Market", "Correction", "Crash"]
        },

        {
            term: "Rally",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A significant or sustained increase in the price of a security or market.",
            simpleExplanation: "A rally is a strong upward move.",
            example: "A stock rising sharply over several trading sessions may be described as having a rally.",
            whyItMatters: "Rallies can happen for many reasons and do not automatically mean a stock is fundamentally stronger.",
            related: ["Bull Market", "Momentum", "Trend"]
        },

        {
            term: "Correction",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A decline in the price of a security or market after a period of gains.",
            simpleExplanation: "A correction is a pullback after prices have risen.",
            example: "A market that falls significantly from a recent high may be described as undergoing a correction.",
            whyItMatters: "Not every price decline means a company is in trouble.",
            related: ["Dip", "Bear Market", "Volatility"]
        },

        {
            term: "Market Crash",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A severe and rapid decline in market prices.",
            simpleExplanation: "A crash is an unusually sharp market fall over a relatively short period.",
            example: "A sudden widespread collapse in stock prices can be called a market crash.",
            whyItMatters: "Crashes demonstrate why risk management and diversification matter.",
            related: ["Bear Market", "Volatility", "Drawdown"]
        },

        {
            term: "Dip",
            category: "Price & Movement",
            level: "Beginner",
            definition: "A decline in the price of a security or market, often relatively short-term.",
            simpleExplanation: "A dip is simply a noticeable drop in price.",
            example: "A stock falling from ₦100 to ₦90 could be described as dipping.",
            whyItMatters: "A dip does not automatically mean a stock is a buying opportunity.",
            related: ["Correction", "Volatility", "Buy the Dip"]
        },

        {
            term: "Volatility",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The degree to which the price of an asset changes over time.",
            simpleExplanation: "Volatility tells you how much and how quickly a price tends to move.",
            example: "A stock moving sharply between ₦50 and ₦70 can be more volatile than one staying around ₦50.",
            whyItMatters: "Higher volatility can mean larger potential gains and losses.",
            related: ["Risk", "Beta", "Price"]
        },

        {
            term: "Momentum",
            category: "Price & Movement",
            level: "Intermediate",
            definition: "The tendency of an asset's price movement to continue in a particular direction for a period.",
            simpleExplanation: "Momentum looks at whether recent price movement appears to have strength behind it.",
            example: "A stock repeatedly making higher highs may be described as having upward momentum.",
            whyItMatters: "Momentum is commonly used in technical analysis.",
            related: ["Trend", "RSI", "Technical Analysis"]
        },

        {
            term: "Trend",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The general direction in which a security's price is moving.",
            simpleExplanation: "A trend describes whether prices are generally moving up, down or sideways.",
            example: "A stock making a series of higher highs and higher lows may have an upward trend.",
            whyItMatters: "Identifying trends can help investors understand price behavior.",
            related: ["Momentum", "Support", "Resistance"]
        },

        {
            term: "All-Time High",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The highest recorded price of a security.",
            simpleExplanation: "It is the highest price the stock has ever reached within the available history.",
            example: "If a stock has never traded above ₦200 and reaches ₦200, it has reached its all-time high.",
            whyItMatters: "It provides context for how the current price compares with historical highs.",
            related: ["52-Week High", "Resistance", "Stock Price"]
        },

        {
            term: "52-Week High",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The highest price at which a stock has traded during the previous 52 weeks.",
            simpleExplanation: "It shows the highest price reached over roughly the last year.",
            example: "If the highest price over the past year was ₦150, the 52-week high is ₦150.",
            whyItMatters: "It gives investors a useful recent reference point.",
            related: ["52-Week Low", "All-Time High"]
        },

        {
            term: "52-Week Low",
            category: "Price & Movement",
            level: "Beginner",
            definition: "The lowest price at which a stock has traded during the previous 52 weeks.",
            simpleExplanation: "It shows the lowest price reached over roughly the last year.",
            example: "If a stock traded as low as ₦40 during the past year, its 52-week low is ₦40.",
            whyItMatters: "It provides context for the stock's recent price range.",
            related: ["52-Week High", "Support"]
        },

        {
            term: "Breakout",
            category: "Price & Movement",
            level: "Intermediate",
            definition: "A price move beyond a level that previously limited the price.",
            simpleExplanation: "A breakout happens when price moves through an important resistance or support area.",
            example: "A stock repeatedly failing near ₦100 and then moving above ₦100 may be described as breaking out.",
            whyItMatters: "Breakouts are commonly watched by technical traders.",
            related: ["Resistance", "Support", "Momentum"]
        },

        {
            term: "Support",
            category: "Price & Movement",
            level: "Intermediate",
            definition: "A price level where buying interest has historically helped prevent further declines.",
            simpleExplanation: "Support is an area where price has often found buyers.",
            example: "If a stock repeatedly falls toward ₦50 and then recovers, ₦50 may be viewed as support.",
            whyItMatters: "Support levels are commonly used in technical analysis.",
            related: ["Resistance", "Breakout", "Technical Analysis"]
        },

        {
            term: "Resistance",
            category: "Price & Movement",
            level: "Intermediate",
            definition: "A price level where selling pressure has historically limited further price increases.",
            simpleExplanation: "Resistance is an area where price has often struggled to move higher.",
            example: "If a stock repeatedly fails around ₦100, traders may consider ₦100 a resistance level.",
            whyItMatters: "Resistance can help traders identify important price areas.",
            related: ["Support", "Breakout", "Technical Analysis"]
        },


        /* ============================================
           COMPANY FUNDAMENTALS
           ============================================ */

        {
            term: "Revenue",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The money a company generates from its business activities before expenses are deducted.",
            simpleExplanation: "Revenue is the money coming into the business from selling its products or services.",
            example: "If a company sells ₦10 billion worth of products during a year, it may report ₦10 billion in revenue.",
            whyItMatters: "Revenue growth can indicate that a company's business is expanding.",
            related: ["Profit", "Revenue Growth", "Gross Profit"]
        },

        {
            term: "Profit",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The amount remaining after a company's expenses are deducted from its revenue.",
            simpleExplanation: "Profit is what the company has left after paying its costs.",
            example: "A company earning ₦10 billion in revenue and spending ₦8 billion may have ₦2 billion in profit before considering the relevant accounting details.",
            whyItMatters: "Profitability is an important part of evaluating a business.",
            related: ["Revenue", "Net Income", "Profit Margin"]
        },

        {
            term: "Net Income",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The profit remaining after a company accounts for its expenses, interest, taxes and other relevant items.",
            simpleExplanation: "Net income is the bottom-line profit reported by a company.",
            example: "A company may report ₦5 billion in net income for a financial year.",
            whyItMatters: "Net income is used in several important financial ratios, including EPS.",
            related: ["Profit", "EPS", "Earnings"]
        },

        {
            term: "Gross Profit",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "Revenue minus the direct costs associated with producing the goods or services sold.",
            simpleExplanation: "Gross profit shows what remains after direct production costs are removed.",
            example: "A company with ₦10 billion revenue and ₦6 billion in direct costs has ₦4 billion gross profit.",
            whyItMatters: "It helps show how efficiently a company generates profit from its core products or services.",
            related: ["Revenue", "Operating Income", "Gross Margin"]
        },

        {
            term: "Operating Income",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "Profit generated from normal business operations before interest and taxes.",
            simpleExplanation: "It shows how profitable the company's main operations are before certain financing and tax costs.",
            example: "A company may have positive operating income even before considering interest expense.",
            whyItMatters: "It helps investors evaluate the performance of the underlying business.",
            related: ["Operating Margin", "Revenue", "Net Income"]
        },

        {
            term: "Earnings",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "A company's profit, often referring to net income.",
            simpleExplanation: "When investors talk about a company's earnings, they are generally talking about the profit it generated.",
            example: "A company reporting higher earnings than last year may be becoming more profitable.",
            whyItMatters: "Earnings are central to company valuation and investor analysis.",
            related: ["Net Income", "EPS", "Earnings Growth"]
        },

        {
            term: "Earnings Per Share (EPS)",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "A company's earnings divided by the number of shares used in the EPS calculation.",
            simpleExplanation: "EPS tells you how much of the company's earnings are attributable to each share.",
            example: "If a company has ₦1 billion of relevant earnings and 100 million shares, EPS could be ₦10.",
            whyItMatters: "EPS is widely used when evaluating a company's profitability and calculating the P/E ratio.",
            related: ["Earnings", "P/E Ratio", "Net Income"]
        },

        {
            term: "Revenue Growth",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The percentage increase or decrease in a company's revenue over a period.",
            simpleExplanation: "It tells you whether the company is generating more or less revenue than before.",
            example: "Revenue increasing from ₦10 billion to ₦12 billion represents 20% growth.",
            whyItMatters: "Growth can provide evidence about the expansion or contraction of a business.",
            related: ["Revenue", "Earnings Growth", "Profit"]
        },

        {
            term: "Earnings Growth",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The percentage increase or decrease in a company's earnings over time.",
            simpleExplanation: "It tells you whether the company's profit is growing or shrinking.",
            example: "If earnings increase from ₦5 billion to ₦6 billion, earnings grew by 20%.",
            whyItMatters: "Sustained earnings growth can influence how investors value a company.",
            related: ["Earnings", "EPS", "Revenue Growth"]
        },

        {
            term: "Profit Margin",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "A measure of how much profit a company generates from its revenue.",
            simpleExplanation: "It shows how much of every unit of revenue remains as profit.",
            example: "A 10% profit margin means ₦10 of profit for every ₦100 of revenue, using the relevant profit measure.",
            whyItMatters: "Margins help investors compare profitability across periods and companies.",
            related: ["Profit", "Revenue", "Operating Margin"]
        },

        {
            term: "Assets",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "Resources owned or controlled by a company that have economic value.",
            simpleExplanation: "Assets are things the company owns or controls that can provide value.",
            example: "Cash, property, equipment and certain investments can be assets.",
            whyItMatters: "Assets help show the financial resources available to a business.",
            related: ["Liabilities", "Equity", "Balance Sheet"]
        },

        {
            term: "Liabilities",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "Financial obligations a company owes to other parties.",
            simpleExplanation: "Liabilities are amounts the company owes.",
            example: "Loans, accounts payable and certain other obligations can be liabilities.",
            whyItMatters: "Understanding liabilities helps you evaluate a company's financial obligations and debt burden.",
            related: ["Assets", "Debt", "Equity"]
        },

        {
            term: "Debt",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "Money a company has borrowed and is obligated to repay.",
            simpleExplanation: "Debt is borrowed money that the company must repay, usually with interest.",
            example: "A company may borrow money from a bank to expand its operations.",
            whyItMatters: "Too much debt can increase financial risk, especially when cash flows are weak.",
            related: ["Liabilities", "Interest", "Debt-to-Equity"]
        },

        {
            term: "Cash Flow",
            category: "Company Fundamentals",
            level: "Beginner",
            definition: "The movement of cash into and out of a company.",
            simpleExplanation: "Cash flow shows how actual cash is moving through the business.",
            example: "A company can report accounting profit while still experiencing weak cash flow.",
            whyItMatters: "Cash is needed to pay employees, suppliers, debt and dividends.",
            related: ["Free Cash Flow", "Profit", "Operating Cash Flow"]
        },

        {
            term: "Free Cash Flow",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "Cash generated by a business after accounting for capital expenditures needed to maintain or expand its operations.",
            simpleExplanation: "It is a way of looking at how much cash the business has left after necessary investment in its operations.",
            example: "A company generating strong operating cash flow but spending heavily on equipment may have lower free cash flow.",
            whyItMatters: "Free cash flow can help investors assess financial flexibility and the company's ability to fund growth, debt payments or shareholder returns.",
            related: ["Cash Flow", "Capital Expenditure", "Dividend"]
        },

        {
            term: "Return on Equity (ROE)",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "A measure of how effectively a company generates profit from shareholders' equity.",
            simpleExplanation: "ROE asks how much profit the company generates relative to the shareholders' money invested in the business.",
            example: "A 15% ROE means the company generated roughly ₦15 of profit per ₦100 of relevant equity.",
            whyItMatters: "It can help compare how efficiently companies use shareholder capital.",
            related: ["Equity", "Profit", "ROA"]
        },

        {
            term: "Return on Assets (ROA)",
            category: "Company Fundamentals",
            level: "Intermediate",
            definition: "A measure of how effectively a company generates profit from its assets.",
            simpleExplanation: "ROA looks at how efficiently the company uses its assets to generate profit.",
            example: "A company with a higher ROA may be generating more profit from each unit of assets.",
            whyItMatters: "It can help compare operational efficiency, especially among similar companies.",
            related: ["Assets", "Profit", "ROE"]
        },


        /* ============================================
           VALUATION
           ============================================ */

        {
            term: "P/E Ratio",
            category: "Valuation",
            level: "Beginner",
            definition: "The price of a share relative to the company's earnings per share.",
            simpleExplanation: "P/E tells you how much investors are paying for each unit of the company's earnings.",
            example: "If a stock trades at ₦100 and its EPS is ₦10, its P/E is 10.",
            whyItMatters: "It is commonly used to compare valuations, especially among similar companies.",
            related: ["EPS", "Earnings", "Valuation"]
        },

        {
            term: "P/B Ratio",
            category: "Valuation",
            level: "Intermediate",
            definition: "A company's share price relative to its book value per share.",
            simpleExplanation: "P/B compares what investors pay for a share with the accounting value attributed to that share.",
            example: "A stock trading at ₦20 with book value per share of ₦10 has a P/B of 2.",
            whyItMatters: "It can be particularly useful when analyzing companies where book value is meaningful.",
            related: ["Book Value", "Equity", "Valuation"]
        },

        {
            term: "P/S Ratio",
            category: "Valuation",
            level: "Intermediate",
            definition: "A company's market value relative to its revenue.",
            simpleExplanation: "P/S shows how much investors are paying for each unit of company revenue.",
            example: "A company valued at ₦100 billion with ₦50 billion revenue has a P/S of 2.",
            whyItMatters: "It can be useful when comparing companies with low or negative earnings.",
            related: ["Revenue", "Market Capitalization", "Valuation"]
        },

        {
            term: "Valuation",
            category: "Valuation",
            level: "Beginner",
            definition: "The process of estimating what an asset or company is worth.",
            simpleExplanation: "Valuation is about asking whether the price makes sense compared with the business's value.",
            example: "An investor may compare a company's price with its earnings, assets and growth prospects.",
            whyItMatters: "A strong company can still be a poor investment if its price is too high.",
            related: ["Fair Value", "Intrinsic Value", "P/E Ratio"]
        },

        {
            term: "Fair Value",
            category: "Valuation",
            level: "Intermediate",
            definition: "An estimate of what an asset should reasonably be worth based on a valuation method.",
            simpleExplanation: "Fair value is an estimated reasonable value, not necessarily the current market price.",
            example: "An investor may estimate a stock's fair value at ₦120 while it currently trades at ₦100.",
            whyItMatters: "Comparing estimated value with market price can help investors evaluate potential opportunities.",
            related: ["Intrinsic Value", "Undervalued", "Overvalued"]
        },

        {
            term: "Intrinsic Value",
            category: "Valuation",
            level: "Intermediate",
            definition: "An estimate of an asset's underlying value based on its expected economic benefits and other relevant factors.",
            simpleExplanation: "It is an estimate of what an investment may really be worth beneath the current market price.",
            example: "An investor may calculate intrinsic value using expected future cash flows.",
            whyItMatters: "It is central to many fundamental investing approaches.",
            related: ["Fair Value", "DCF", "Margin of Safety"]
        },

        {
            term: "Undervalued",
            category: "Valuation",
            level: "Beginner",
            definition: "Describes an asset that appears to be worth more than its current market price based on a particular valuation analysis.",
            simpleExplanation: "The investor believes the market price is lower than the estimated value.",
            example: "If an investor estimates fair value at ₦100 while the stock trades at ₦70, they may consider it undervalued.",
            whyItMatters: "Finding potentially undervalued investments is a common investing approach.",
            related: ["Fair Value", "Intrinsic Value", "Margin of Safety"]
        },

        {
            term: "Overvalued",
            category: "Valuation",
            level: "Beginner",
            definition: "Describes an asset whose market price appears higher than its estimated value based on a particular analysis.",
            simpleExplanation: "The investor believes the market is pricing the asset above what it is worth.",
            example: "If an investor estimates fair value at ₦100 while the stock trades at ₦150, they may consider it overvalued.",
            whyItMatters: "A high-quality company can still be unattractive if its price is too high.",
            related: ["Fair Value", "Intrinsic Value", "P/E Ratio"]
        },

        {
            term: "Margin of Safety",
            category: "Valuation",
            level: "Intermediate",
            definition: "The difference between an investment's estimated intrinsic value and its market price, used as a buffer against uncertainty.",
            simpleExplanation: "It means buying below your estimated value so you have some room for error.",
            example: "If you estimate fair value at ₦100 and buy at ₦75, the difference provides a margin of safety.",
            whyItMatters: "Valuation estimates are uncertain, so a buffer can reduce the impact of being wrong.",
            related: ["Intrinsic Value", "Fair Value", "Undervalued"]
        },

        {
            term: "DCF",
            category: "Valuation",
            level: "Advanced",
            definition: "Discounted Cash Flow, a valuation method that estimates value using expected future cash flows discounted to their present value.",
            simpleExplanation: "DCF tries to work out what future cash generated by a business is worth today.",
            example: "An analyst forecasts future free cash flow and discounts those amounts back to today's value.",
            whyItMatters: "DCF can provide a detailed way to estimate a company's intrinsic value.",
            related: ["Free Cash Flow", "Intrinsic Value", "Discount Rate"]
        },


        /* ============================================
           DIVIDENDS
           ============================================ */

        {
            term: "Dividend",
            category: "Dividends",
            level: "Beginner",
            definition: "A distribution of money or other value from a company to its shareholders.",
            simpleExplanation: "A dividend is one way a company can return money to shareholders.",
            example: "A company may declare a cash dividend of ₦2 per share.",
            whyItMatters: "Dividends can form an important part of an investor's total return.",
            related: ["Dividend Yield", "Payout Ratio", "Ex-Dividend Date"]
        },

        {
            term: "Dividend Per Share",
            category: "Dividends",
            level: "Beginner",
            definition: "The amount of dividend paid for each eligible share.",
            simpleExplanation: "It tells you how much dividend is associated with one share.",
            example: "A dividend of ₦3 per share means an investor holding 100 eligible shares could receive ₦300 before applicable taxes or other deductions.",
            whyItMatters: "It helps investors estimate potential dividend income.",
            related: ["Dividend", "Dividend Yield", "Payout Ratio"]
        },

        {
            term: "Dividend Yield",
            category: "Dividends",
            level: "Beginner",
            definition: "A measure of annual dividend payments relative to a stock's price.",
            simpleExplanation: "It shows the dividend return as a percentage of the stock price.",
            example: "If a stock pays ₦5 per year and trades at ₦100, the dividend yield is 5%.",
            whyItMatters: "It helps compare dividend income across investments.",
            related: ["Dividend", "Dividend Per Share", "Payout Ratio"]
        },

        {
            term: "Payout Ratio",
            category: "Dividends",
            level: "Intermediate",
            definition: "The proportion of a company's earnings paid to shareholders as dividends.",
            simpleExplanation: "It tells you how much of the company's earnings are being distributed instead of retained.",
            example: "If a company earns ₦10 per share and pays ₦4 in dividends, the payout ratio is 40%.",
            whyItMatters: "It can help investors evaluate the sustainability of a dividend.",
            related: ["Dividend", "EPS", "Dividend Yield"]
        },

        {
            term: "Ex-Dividend Date",
            category: "Dividends",
            level: "Beginner",
            definition: "The date on and after which a newly purchased share is generally not entitled to the upcoming dividend.",
            simpleExplanation: "It is an important cutoff date for determining dividend eligibility.",
            example: "Buying on or after the ex-dividend date generally means you will not receive that upcoming dividend.",
            whyItMatters: "Investors need to understand dividend dates before buying or selling around a dividend.",
            related: ["Dividend", "Record Date", "Payment Date"]
        },

        {
            term: "Record Date",
            category: "Dividends",
            level: "Intermediate",
            definition: "The date on which a company determines which shareholders are entitled to a dividend or other corporate distribution.",
            simpleExplanation: "The company checks its shareholder records on this date.",
            example: "Shareholders meeting the eligibility requirements by the record date may qualify for the announced dividend.",
            whyItMatters: "It is one of the key dates in the dividend process.",
            related: ["Dividend", "Ex-Dividend Date", "Payment Date"]
        },

        {
            term: "Payment Date",
            category: "Dividends",
            level: "Beginner",
            definition: "The date on which an announced dividend is actually paid to eligible shareholders.",
            simpleExplanation: "This is when the dividend money is distributed.",
            example: "A company announces a dividend with a payment date several weeks after the record date.",
            whyItMatters: "It tells investors when they should expect the dividend payment.",
            related: ["Dividend", "Record Date", "Ex-Dividend Date"]
        },


        /* ============================================
           PORTFOLIO
           ============================================ */

        {
            term: "Portfolio",
            category: "Portfolio",
            level: "Beginner",
            definition: "The collection of investments owned by an investor.",
            simpleExplanation: "Your portfolio is everything you currently hold as investments.",
            example: "A portfolio could contain shares of banks, telecom companies and consumer companies.",
            whyItMatters: "Looking at the portfolio as a whole helps you manage risk rather than evaluating every stock separately.",
            related: ["Holdings", "Position", "Diversification"]
        },

        {
            term: "Position",
            category: "Portfolio",
            level: "Beginner",
            definition: "An investor's holding in a particular security.",
            simpleExplanation: "A position is your specific investment in one stock or asset.",
            example: "Owning 200 shares of a company represents a position in that company.",
            whyItMatters: "Position-level analysis helps you understand the performance and risk of each investment.",
            related: ["Portfolio", "Holding", "Shares"]
        },

        {
            term: "Holdings",
            category: "Portfolio",
            level: "Beginner",
            definition: "The individual investments owned within a portfolio.",
            simpleExplanation: "Your holdings are the stocks and other investments you currently own.",
            example: "If your portfolio contains GTCO and another company, those are two of your holdings.",
            whyItMatters: "Knowing your holdings is the foundation of portfolio management.",
            related: ["Portfolio", "Position", "Allocation"]
        },

        {
            term: "Average Cost",
            category: "Portfolio",
            level: "Beginner",
            definition: "The average amount paid per share for a position.",
            simpleExplanation: "It shows the average price you paid for the shares you currently hold.",
            example: "Buying 10 shares at ₦100 and 10 at ₦120 gives an average cost of ₦110 per share before applicable fees.",
            whyItMatters: "It helps you understand the performance of a position.",
            related: ["Cost Basis", "Unrealized Gain", "Position"]
        },

        {
            term: "Cost Basis",
            category: "Portfolio",
            level: "Intermediate",
            definition: "The amount used as the tax or accounting basis for determining gains or losses on an investment, subject to applicable rules.",
            simpleExplanation: "It is the relevant starting value used to calculate how much you gained or lost.",
            example: "The cost basis may include the purchase cost and, depending on the rules, certain transaction costs.",
            whyItMatters: "Cost basis is important when calculating investment gains and potential taxes.",
            related: ["Average Cost", "Realized Gain", "Unrealized Gain"]
        },

        {
            term: "Unrealized Gain",
            category: "Portfolio",
            level: "Beginner",
            definition: "An increase in the value of an investment that has not yet been realized through a sale.",
            simpleExplanation: "Your investment is worth more than you paid, but you still own it.",
            example: "You buy shares for ₦100,000 and they are now worth ₦120,000. The ₦20,000 increase is an unrealized gain.",
            whyItMatters: "It shows how your holdings are performing before you sell.",
            related: ["Realized Gain", "Unrealized Loss", "Average Cost"]
        },

        {
            term: "Unrealized Loss",
            category: "Portfolio",
            level: "Beginner",
            definition: "A decrease in the value of an investment that has not yet been realized through a sale.",
            simpleExplanation: "The investment is currently worth less than your relevant cost basis, but you still own it.",
            example: "You invest ₦100,000 and the position is now worth ₦80,000. The ₦20,000 decline is an unrealized loss.",
            whyItMatters: "It helps you distinguish a current paper loss from a loss that has been realized by selling.",
            related: ["Realized Loss", "Unrealized Gain", "Drawdown"]
        },

        {
            term: "Realized Gain",
            category: "Portfolio",
            level: "Beginner",
            definition: "A gain that occurs when an investment is sold for more than its relevant cost basis.",
            simpleExplanation: "You have actually sold the investment for more than your relevant starting cost.",
            example: "You buy shares for ₦100,000 and later sell them for ₦130,000, creating a ₦30,000 gain before applicable costs and taxes.",
            whyItMatters: "Realized gains are different from gains that exist only because the market price has increased.",
            related: ["Unrealized Gain", "Cost Basis", "Realized Loss"]
        },

        {
            term: "Realized Loss",
            category: "Portfolio",
            level: "Beginner",
            definition: "A loss that occurs when an investment is sold for less than its relevant cost basis.",
            simpleExplanation: "You have actually sold the investment for less than your relevant starting cost.",
            example: "You buy shares for ₦100,000 and sell them for ₦80,000, creating a ₦20,000 loss before applicable costs and taxes.",
            whyItMatters: "Realized losses can have different financial and tax implications from unrealized losses.",
            related: ["Unrealized Loss", "Cost Basis", "Realized Gain"]
        },

        {
            term: "Portfolio Allocation",
            category: "Portfolio",
            level: "Beginner",
            definition: "The percentage of a portfolio invested in each asset, security or category.",
            simpleExplanation: "Allocation shows where your money is distributed.",
            example: "A portfolio might have 50% in banking stocks and 50% in consumer companies.",
            whyItMatters: "Allocation helps you understand concentration and risk.",
            related: ["Portfolio", "Diversification", "Concentration"]
        },

        {
            term: "Diversification",
            category: "Portfolio",
            level: "Beginner",
            definition: "Spreading investments across different assets, companies, sectors or markets to reduce concentration risk.",
            simpleExplanation: "Instead of putting everything in one place, you spread your investments.",
            example: "Owning companies from different sectors can reduce reliance on one industry.",
            whyItMatters: "Diversification can reduce the impact of a poor outcome in one investment.",
            related: ["Portfolio", "Concentration", "Risk"]
        },

        {
            term: "Concentration",
            category: "Portfolio",
            level: "Beginner",
            definition: "Having a large portion of a portfolio exposed to one investment, sector or other category.",
            simpleExplanation: "Your portfolio is concentrated when too much depends on one area.",
            example: "If 80% of a portfolio is invested in one company, it has high company concentration.",
            whyItMatters: "High concentration can make portfolio performance heavily dependent on a small number of investments.",
            related: ["Diversification", "Allocation", "Risk"]
        },

        {
            term: "Rebalancing",
            category: "Portfolio",
            level: "Intermediate",
            definition: "Adjusting a portfolio to bring its allocation back toward a desired target.",
            simpleExplanation: "You change your holdings when your portfolio moves too far away from your intended mix.",
            example: "A portfolio intended to have 60% stocks and 40% other assets may be adjusted after market movements change those percentages.",
            whyItMatters: "Rebalancing helps maintain an intended risk profile.",
            related: ["Portfolio Allocation", "Diversification", "Risk"]
        },

        {
            term: "Drawdown",
            category: "Portfolio",
            level: "Intermediate",
            definition: "The decline in value from a previous peak to a subsequent low.",
            simpleExplanation: "Drawdown measures how far an investment or portfolio has fallen from a previous high.",
            example: "If a portfolio falls from ₦1,000,000 to ₦800,000, the drawdown is 20%.",
            whyItMatters: "It helps investors understand the severity of declines and risk.",
            related: ["Risk", "Volatility", "Portfolio"]
        },


        /* ============================================
           TECHNICAL ANALYSIS
           ============================================ */

        {
            term: "Technical Analysis",
            category: "Technical Analysis",
            level: "Beginner",
            definition: "The study of price, volume and other market data to evaluate patterns and potential market behavior.",
            simpleExplanation: "Technical analysis focuses mainly on what the market has been doing rather than the company's financial statements.",
            example: "A trader may study price charts, volume and moving averages.",
            whyItMatters: "It is widely used by traders to analyze market behavior.",
            related: ["Chart", "Candlestick", "Support", "Resistance"]
        },

        {
            term: "Candlestick",
            category: "Technical Analysis",
            level: "Beginner",
            definition: "A chart element that displays price information for a specific period, including open, high, low and close.",
            simpleExplanation: "A candlestick summarizes how price moved during a period.",
            example: "A daily candle can show the opening, highest, lowest and closing prices for that day.",
            whyItMatters: "Candlesticks are one of the most common ways to read price charts.",
            related: ["OHLC", "Chart", "Volume"]
        },

        {
            term: "OHLC",
            category: "Technical Analysis",
            level: "Beginner",
            definition: "Open, High, Low and Close — four key price points for a trading period.",
            simpleExplanation: "OHLC tells you where the price started, how high it went, how low it went and where it ended.",
            example: "A stock could have an open of ₦100, high of ₦110, low of ₦95 and close of ₦108.",
            whyItMatters: "OHLC data is the foundation of many stock charts and technical indicators.",
            related: ["Candlestick", "Stock Price", "Chart"]
        },

        {
            term: "SMA",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "Simple Moving Average, the average price of a security over a specified number of periods.",
            simpleExplanation: "SMA smooths price data so you can see the general direction more clearly.",
            example: "A 20-day SMA calculates the average closing price over the selected 20-day period.",
            whyItMatters: "Moving averages are commonly used to identify trends.",
            related: ["EMA", "Trend", "Technical Analysis"]
        },

        {
            term: "EMA",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "Exponential Moving Average, a moving average that gives more weight to recent prices.",
            simpleExplanation: "EMA reacts more quickly to recent price changes than a simple moving average.",
            example: "A trader may use a 20-day EMA to track a stock's recent trend.",
            whyItMatters: "It is commonly used in trend and momentum analysis.",
            related: ["SMA", "MACD", "Trend"]
        },

        {
            term: "RSI",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "Relative Strength Index, a momentum indicator that measures the magnitude of recent price changes.",
            simpleExplanation: "RSI helps show whether recent price movement has been relatively strong or weak.",
            example: "An RSI reading above 70 is often described as overbought, while a reading below 30 is often described as oversold, though these are not automatic buy or sell signals.",
            whyItMatters: "It can provide context about momentum and potential extreme price conditions.",
            related: ["Momentum", "Overbought", "Oversold"]
        },

        {
            term: "MACD",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "Moving Average Convergence Divergence, a momentum and trend-following indicator based on moving averages.",
            simpleExplanation: "MACD compares moving averages to help analyze momentum and trend changes.",
            example: "Traders may watch MACD line and signal-line interactions for potential momentum changes.",
            whyItMatters: "It is one of the most widely used technical indicators.",
            related: ["EMA", "Momentum", "Trend"]
        },

        {
            term: "Overbought",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "A condition in which an asset has experienced strong upward movement and may be considered extended by certain technical indicators.",
            simpleExplanation: "It means recent buying has pushed the price strongly upward according to a particular indicator or method.",
            example: "An RSI above 70 is commonly interpreted as an overbought condition.",
            whyItMatters: "Overbought does not automatically mean a stock will fall.",
            related: ["RSI", "Oversold", "Momentum"]
        },

        {
            term: "Oversold",
            category: "Technical Analysis",
            level: "Intermediate",
            definition: "A condition in which an asset has experienced strong downward movement and may be considered extended by certain technical indicators.",
            simpleExplanation: "It means recent selling has pushed the price strongly downward according to a particular indicator or method.",
            example: "An RSI below 30 is commonly interpreted as an oversold condition.",
            whyItMatters: "Oversold does not automatically mean a stock will rise.",
            related: ["RSI", "Overbought", "Momentum"]
        },


        /* ============================================
           RISK
           ============================================ */

        {
            term: "Risk",
            category: "Risk",
            level: "Beginner",
            definition: "The possibility that an investment outcome will differ negatively from what an investor expects.",
            simpleExplanation: "Risk is the possibility of losing money or not getting the result you expected.",
            example: "A company facing severe financial problems may carry higher investment risk.",
            whyItMatters: "Understanding risk helps investors make decisions that fit their goals and tolerance.",
            related: ["Volatility", "Diversification", "Drawdown"]
        },

        {
            term: "Risk-Reward Ratio",
            category: "Risk",
            level: "Intermediate",
            definition: "A comparison between the potential loss and potential gain associated with an investment or trade.",
            simpleExplanation: "It compares what you could lose with what you hope to gain.",
            example: "A setup with potential ₦10 gain and ₦5 loss has a 2:1 potential reward-to-risk relationship.",
            whyItMatters: "It helps investors think about potential outcomes before entering a position.",
            related: ["Risk", "Position Sizing", "Stop-Loss"]
        },

        {
            term: "Beta",
            category: "Risk",
            level: "Intermediate",
            definition: "A measure of how a security's historical price movement has related to movements in a benchmark.",
            simpleExplanation: "Beta gives an indication of how strongly a stock has tended to move relative to a market benchmark.",
            example: "A beta above 1 can indicate that a stock has historically moved more than the benchmark, though beta is not a guarantee of future behavior.",
            whyItMatters: "It can help investors understand historical market sensitivity.",
            related: ["Volatility", "Risk", "Market"]
        },

        {
            term: "Stop-Loss",
            category: "Risk",
            level: "Intermediate",
            definition: "An order or predefined exit rule designed to limit losses if a position moves against the investor.",
            simpleExplanation: "It is a way of deciding in advance when to exit if the trade moves too far against you.",
            example: "A trader may decide to exit a position if the price falls below a predetermined level.",
            whyItMatters: "Predefined risk limits can help prevent one position from causing an unexpectedly large loss.",
            related: ["Risk", "Position Sizing", "Order"]
        },

        {
            term: "Position Sizing",
            category: "Risk",
            level: "Intermediate",
            definition: "Determining how much money or how many shares to allocate to an investment or trade.",
            simpleExplanation: "It answers the question: how big should this position be?",
            example: "An investor may limit a single stock to a certain percentage of the portfolio.",
            whyItMatters: "Position size has a major effect on how much a single investment can affect the portfolio.",
            related: ["Risk", "Portfolio Allocation", "Diversification"]
        },

        {
            term: "Market Risk",
            category: "Risk",
            level: "Beginner",
            definition: "The risk of losses caused by broad movements in financial markets.",
            simpleExplanation: "Sometimes the whole market falls, even when an individual company is performing reasonably well.",
            example: "A broad economic shock can cause many stocks to decline together.",
            whyItMatters: "Diversification cannot completely eliminate broad market risk.",
            related: ["Risk", "Diversification", "Bear Market"]
        },

        {
            term: "Liquidity Risk",
            category: "Risk",
            level: "Intermediate",
            definition: "The risk that an asset cannot be bought or sold quickly at a reasonable price.",
            simpleExplanation: "You may struggle to get in or out of an investment without significantly affecting the price.",
            example: "A thinly traded stock may have high liquidity risk.",
            whyItMatters: "Liquidity can become especially important when you need to exit a position quickly.",
            related: ["Liquidity", "Spread", "Slippage"]
        },

        {
            term: "Concentration Risk",
            category: "Risk",
            level: "Beginner",
            definition: "The risk created when too much of a portfolio depends on one investment, sector or category.",
            simpleExplanation: "If too much of your money depends on one thing, a bad outcome there can hurt the whole portfolio.",
            example: "Putting most of a portfolio into one company creates significant concentration risk.",
            whyItMatters: "It is one reason diversification matters.",
            related: ["Diversification", "Concentration", "Portfolio Allocation"]
        },


        /* ============================================
           CORPORATE EVENTS
           ============================================ */

        {
            term: "Earnings Report",
            category: "Corporate Events",
            level: "Beginner",
            definition: "A company report containing financial results for a particular reporting period.",
            simpleExplanation: "It tells investors how the company performed financially.",
            example: "A quarterly earnings report may include revenue, profit, cash flow and other financial information.",
            whyItMatters: "Earnings reports can provide important evidence about whether a company's business is improving or weakening.",
            related: ["Earnings", "Revenue", "Net Income"]
        },

        {
            term: "Annual Report",
            category: "Corporate Events",
            level: "Beginner",
            definition: "A detailed report describing a company's financial performance and other important information over a financial year.",
            simpleExplanation: "It is one of the main documents investors can use to study a company.",
            example: "An annual report may contain financial statements, business discussion and risk information.",
            whyItMatters: "It can provide a much deeper picture of the company than a stock price alone.",
            related: ["Financial Statements", "Earnings Report", "Company"]
        },

        {
            term: "IPO",
            category: "Corporate Events",
            level: "Beginner",
            definition: "Initial Public Offering, when a private company offers shares to the public as part of becoming publicly traded.",
            simpleExplanation: "An IPO is one way a company enters the public stock market.",
            example: "A private company may conduct an IPO and then have its shares traded on an exchange.",
            whyItMatters: "IPOs introduce new publicly traded companies to investors.",
            related: ["Stock Exchange", "Share", "Listing"]
        },

        {
            term: "Stock Split",
            category: "Corporate Events",
            level: "Beginner",
            definition: "A corporate action that increases the number of shares while proportionally reducing the price per share.",
            simpleExplanation: "The company divides each existing share into multiple shares without changing the overall ownership value immediately from the split itself.",
            example: "In a 2-for-1 split, one share becomes two shares and the per-share price is adjusted accordingly.",
            whyItMatters: "Stock splits change the number of shares and quoted price but do not by themselves create value.",
            related: ["Reverse Split", "Share", "Corporate Action"]
        },

        {
            term: "Reverse Stock Split",
            category: "Corporate Events",
            level: "Intermediate",
            definition: "A corporate action that reduces the number of shares while proportionally increasing the price per share.",
            simpleExplanation: "Several shares are combined into fewer shares.",
            example: "In a 1-for-5 reverse split, every five shares may become one share, subject to the company's terms.",
            whyItMatters: "It changes the share count and price without automatically changing the underlying value of the company.",
            related: ["Stock Split", "Share", "Corporate Action"]
        },

        {
            term: "Share Buyback",
            category: "Corporate Events",
            level: "Intermediate",
            definition: "A company purchasing its own shares from the market or shareholders.",
            simpleExplanation: "The company uses money to buy back some of its own shares.",
            example: "A company may repurchase shares if management believes they are attractively priced or wants to return capital to shareholders.",
            whyItMatters: "Buybacks can affect the number of shares outstanding and metrics such as EPS.",
            related: ["EPS", "Dividend", "Corporate Action"]
        },

        {
            term: "Merger",
            category: "Corporate Events",
            level: "Intermediate",
            definition: "A transaction in which two companies combine their businesses under agreed terms.",
            simpleExplanation: "Two businesses join together.",
            example: "Two companies may combine operations to create a larger organization.",
            whyItMatters: "Mergers can significantly change a company's strategy, finances and ownership structure.",
            related: ["Acquisition", "Corporate Action", "Company"]
        },

        {
            term: "Acquisition",
            category: "Corporate Events",
            level: "Intermediate",
            definition: "A transaction in which one company purchases control of another company or business.",
            simpleExplanation: "One company buys another company or a significant part of its business.",
            example: "A larger company may acquire a smaller competitor.",
            whyItMatters: "Acquisitions can change the future growth prospects and financial structure of the companies involved.",
            related: ["Merger", "Corporate Action"]
        },

        {
            term: "Delisting",
            category: "Corporate Events",
            level: "Intermediate",
            definition: "The removal of a security from trading on a stock exchange.",
            simpleExplanation: "The stock is no longer listed for trading on that exchange.",
            example: "A company may be delisted because of a corporate transaction or failure to meet listing requirements.",
            whyItMatters: "Delisting can significantly affect how investors can trade their shares.",
            related: ["Stock Exchange", "Listing", "Corporate Action"]
        },


        /* ============================================
           INVESTING STRATEGIES
           ============================================ */

        {
            term: "Day Trading",
            category: "Strategies",
            level: "Intermediate",
            definition: "Buying and selling securities within the same trading day, typically seeking to benefit from short-term price movements.",
            simpleExplanation: "A day trader generally opens and closes trades during the same day.",
            example: "A trader buys a stock in the morning and sells it before the trading session ends.",
            whyItMatters: "Day trading requires careful risk management and can be highly demanding.",
            related: ["Trading", "Swing Trading", "Volatility"]
        },

        {
            term: "Swing Trading",
            category: "Strategies",
            level: "Intermediate",
            definition: "A trading approach that seeks to capture price movements over several days or weeks.",
            simpleExplanation: "Swing traders generally hold positions longer than day traders but shorter than long-term investors.",
            example: "A trader may hold a stock for two weeks expecting a price move.",
            whyItMatters: "It is a common short-to-medium-term trading approach.",
            related: ["Day Trading", "Momentum", "Technical Analysis"]
        },

        {
            term: "Value Investing",
            category: "Strategies",
            level: "Beginner",
            definition: "An investing approach focused on finding securities believed to be priced below their underlying value.",
            simpleExplanation: "Value investors look for investments that appear cheaper than what they believe they are worth.",
            example: "An investor may research a company and believe its current share price is below its estimated intrinsic value.",
            whyItMatters: "It encourages investors to think about business value rather than price alone.",
            related: ["Intrinsic Value", "Undervalued", "Margin of Safety"]
        },

        {
            term: "Growth Investing",
            category: "Strategies",
            level: "Beginner",
            definition: "An investing approach focused on companies expected to grow revenue, earnings or other measures significantly over time.",
            simpleExplanation: "Growth investors focus on businesses they believe can expand substantially.",
            example: "An investor may buy a company because they expect its earnings to grow rapidly.",
            whyItMatters: "Growth expectations can strongly influence stock valuations.",
            related: ["Revenue Growth", "Earnings Growth", "Valuation"]
        },

        {
            term: "Dividend Investing",
            category: "Strategies",
            level: "Beginner",
            definition: "An investing approach that emphasizes companies that pay dividends.",
            simpleExplanation: "Dividend investors focus on receiving regular shareholder distributions as part of their investment return.",
            example: "An investor may build a portfolio of companies with established dividend policies.",
            whyItMatters: "Dividends can provide income and contribute to total return.",
            related: ["Dividend", "Dividend Yield", "Payout Ratio"]
        },

        {
            term: "Dollar-Cost Averaging",
            category: "Strategies",
            level: "Beginner",
            definition: "An approach of investing a predetermined amount at regular intervals regardless of short-term price movements.",
            simpleExplanation: "You invest regularly instead of trying to perfectly time the market.",
            example: "An investor might invest ₦50,000 into selected investments every month.",
            whyItMatters: "Regular investing can reduce the need to make one large timing decision.",
            related: ["Investing", "Market Timing", "Portfolio"]
        },

        {
            term: "Buy and Hold",
            category: "Strategies",
            level: "Beginner",
            definition: "An investing approach where an investor purchases an investment and intends to hold it for a long period.",
            simpleExplanation: "You invest with a long-term view rather than constantly trading.",
            example: "An investor may buy shares in a strong company and hold them for many years.",
            whyItMatters: "It can reduce unnecessary trading and keep attention on long-term business performance.",
            related: ["Long-Term Investing", "Value Investing", "Growth Investing"]
        },


        /* ============================================
           MARKET MECHANICS
           ============================================ */

        {
            term: "Trading Session",
            category: "Market Mechanics",
            level: "Beginner",
            definition: "A period during which a stock exchange is open for trading.",
            simpleExplanation: "It is the time when the market is officially open for normal trading.",
            example: "A stock exchange has defined trading hours on its trading days.",
            whyItMatters: "Prices generally update through active market trading sessions.",
            related: ["Stock Exchange", "Trading", "Market Hours"]
        },

        {
            term: "Market Maker",
            category: "Market Mechanics",
            level: "Intermediate",
            definition: "A participant that helps provide liquidity by being willing to buy and sell securities under defined conditions.",
            simpleExplanation: "Market makers can help keep markets functioning by providing buying and selling interest.",
            example: "A market maker may continuously quote prices at which it is willing to buy or sell.",
            whyItMatters: "Market makers can play an important role in liquidity and efficient trading.",
            related: ["Liquidity", "Bid", "Ask", "Spread"]
        },

        {
            term: "Trading Halt",
            category: "Market Mechanics",
            level: "Intermediate",
            definition: "A temporary suspension of trading in a security or market.",
            simpleExplanation: "Trading is temporarily stopped.",
            example: "An exchange may halt trading in a stock while important information is being handled.",
            whyItMatters: "Investors may be unable to buy or sell during a halt.",
            related: ["Circuit Breaker", "Stock Exchange"]
        },

        {
            term: "Circuit Breaker",
            category: "Market Mechanics",
            level: "Intermediate",
            definition: "A mechanism designed to temporarily restrict or halt trading during unusually large price movements.",
            simpleExplanation: "It is a safety mechanism intended to slow extreme market moves.",
            example: "An exchange may temporarily halt trading after a security or index moves beyond a defined threshold.",
            whyItMatters: "Circuit breakers are designed to reduce disorderly trading during extreme conditions.",
            related: ["Trading Halt", "Volatility", "Market Crash"]
        },

        {
            term: "Settlement",
            category: "Market Mechanics",
            level: "Intermediate",
            definition: "The process through which a completed trade is formally finalized, including delivery of securities and payment according to the applicable market rules.",
            simpleExplanation: "The trade has happened, and settlement is the process that completes the exchange of money and securities.",
            example: "After a trade executes, the transaction goes through the market's settlement process.",
            whyItMatters: "Execution and settlement are related but are not the same thing.",
            related: ["Execution", "Clearing", "Trade"]
        },

        {
            term: "Short Selling",
            category: "Market Mechanics",
            level: "Advanced",
            definition: "A strategy in which an investor sells borrowed securities with the intention of buying them back later at a lower price.",
            simpleExplanation: "You are attempting to profit if the price falls.",
            example: "A trader borrows shares, sells them, and hopes to repurchase them later for less.",
            whyItMatters: "Short selling carries significant risks because losses can become very large if the price rises.",
            related: ["Margin", "Leverage", "Risk"]
        },

        {
            term: "Margin",
            category: "Market Mechanics",
            level: "Advanced",
            definition: "Money or securities used as collateral when borrowing funds to make investments or trades.",
            simpleExplanation: "Margin allows an investor to use borrowed money or collateral to increase market exposure.",
            example: "A broker may require an investor to maintain a certain amount of collateral for a leveraged position.",
            whyItMatters: "Margin can increase both potential gains and potential losses.",
            related: ["Leverage", "Risk", "Short Selling"]
        },

        {
            term: "Leverage",
            category: "Market Mechanics",
            level: "Advanced",
            definition: "Using borrowed money or other financial mechanisms to increase exposure to an investment.",
            simpleExplanation: "Leverage lets you control a larger position than you could with your own money alone.",
            example: "An investor using borrowed funds can gain exposure to more shares than their cash alone would allow.",
            whyItMatters: "Leverage magnifies both gains and losses.",
            related: ["Margin", "Risk", "Short Selling"]
        },


        /* ============================================
           GENERAL INVESTING TERMS
           ============================================ */

        {
            term: "Return",
            category: "General Investing",
            level: "Beginner",
            definition: "The gain or loss produced by an investment over a period.",
            simpleExplanation: "Return tells you how your investment performed.",
            example: "If an investment grows from ₦100,000 to ₦110,000, the price return is 10% before considering other factors.",
            whyItMatters: "Return is one of the main ways investors evaluate investment performance.",
            related: ["Profit", "Capital Gain", "Dividend"]
        },

        {
            term: "Capital Gain",
            category: "General Investing",
            level: "Beginner",
            definition: "An increase in the value of an investment relative to its purchase price or other relevant basis.",
            simpleExplanation: "You make a capital gain when an investment becomes more valuable.",
            example: "Buying shares at ₦50 and selling them at ₦80 creates a ₦30 gain per share before costs and taxes.",
            whyItMatters: "Capital gains can be an important part of investment returns.",
            related: ["Return", "Realized Gain", "Unrealized Gain"]
        },

        {
            term: "Benchmark",
            category: "General Investing",
            level: "Intermediate",
            definition: "A standard used to compare the performance of an investment or portfolio.",
            simpleExplanation: "A benchmark gives you something meaningful to compare your results against.",
            example: "An investor may compare a portfolio's performance with a relevant market index.",
            whyItMatters: "A portfolio gaining 10% means something different depending on how the relevant market performed.",
            related: ["Index", "Portfolio", "Return"]
        },

        {
            term: "Total Return",
            category: "General Investing",
            level: "Beginner",
            definition: "The overall return from an investment, including price changes and income such as dividends where applicable.",
            simpleExplanation: "It looks at more than just whether the share price went up.",
            example: "A stock's total return can include both its price appreciation and dividends received.",
            whyItMatters: "It gives a more complete picture of investment performance.",
            related: ["Return", "Dividend", "Capital Gain"]
        },

        {
            term: "Market Sentiment",
            category: "General Investing",
            level: "Beginner",
            definition: "The overall attitude or mood of investors toward a market, stock or economic situation.",
            simpleExplanation: "It describes whether investors generally feel optimistic or pessimistic.",
            example: "Strong optimism about a company's future can create positive sentiment around its stock.",
            whyItMatters: "Sentiment can influence prices in the short term even when fundamentals have not changed much.",
            related: ["Bull Market", "Bear Market", "Momentum"]
        },

        {
            term: "Fundamental Analysis",
            category: "General Investing",
            level: "Beginner",
            definition: "The evaluation of a company using financial, economic and business information to estimate its quality or value.",
            simpleExplanation: "Fundamental analysis looks at the business behind the stock.",
            example: "An investor may study revenue, earnings, debt, cash flow and competitive position.",
            whyItMatters: "It helps investors understand whether a company's business supports its market valuation.",
            related: ["Revenue", "Earnings", "Valuation"]
        }

    ]
};