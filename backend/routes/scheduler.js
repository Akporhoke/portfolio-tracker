const express = require('express');

const SchedulerStatus =
    require('../models/SchedulerStatus');

const router =
    express.Router();

router.get(
    '/status',
    async (req, res) => {

        try {

            const historySync =
                await SchedulerStatus.findOne({
                    job: 'history_sync'
                })
                    .lean();

            res.json({
                success: true,

                historySync:
                    historySync || {
                        status: 'idle',
                        lastSuccessfulAt: null
                    }
            });

        } catch (error) {

            console.error(
                '[SchedulerStatus]',
                error.message
            );

            res.status(500).json({
                success: false,
                error:
                    'Unable to retrieve scheduler status'
            });
        }
    }
);

module.exports = router;