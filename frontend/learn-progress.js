/* ============================================
   GAZE LEARN — PROGRESS (storage + maths only)

   Saved on this device in localStorage for now.
   When login arrives, only load() and save() need
   to change to talk to your backend.

   Saved shape:
   {
     completed: { "lesson-id": "2026-10-05T10:00:00.000Z" },
     bookmarks: [ "lesson-id" ],
     last: { trackId, lessonId, section }
   }
   ============================================ */

window.GazeLearnProgress = (function () {

    'use strict';

    const KEY = 'gazeLearn:v1';

    let data = load();


    function empty() {
        return {
            completed: {},
            bookmarks: [],
            last: null
        };
    }


    function load() {

        try {

            const raw = localStorage.getItem(KEY);

            if (!raw) {
                return empty();
            }

            const parsed = JSON.parse(raw);

            return {
                completed:
                    parsed.completed &&
                    typeof parsed.completed === 'object'
                        ? parsed.completed
                        : {},

                bookmarks:
                    Array.isArray(parsed.bookmarks)
                        ? parsed.bookmarks
                        : [],

                last: parsed.last || null
            };

        } catch (err) {

            return empty();
        }
    }


    function save() {

        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (err) {
            /* storage unavailable: progress lasts for this visit only */
        }
    }


    /* ------------- lessons ------------- */

    function isCompleted(lessonId) {
        return Boolean(data.completed[lessonId]);
    }


    function markCompleted(lessonId) {

        if (!data.completed[lessonId]) {
            data.completed[lessonId] = new Date().toISOString();
            save();
        }
    }


    /* ------------- bookmarks ------------- */

    function isBookmarked(lessonId) {
        return data.bookmarks.includes(lessonId);
    }


    function toggleBookmark(lessonId) {

        const index = data.bookmarks.indexOf(lessonId);

        if (index === -1) {
            data.bookmarks.push(lessonId);
        } else {
            data.bookmarks.splice(index, 1);
        }

        save();

        return index === -1;
    }


    function getBookmarks() {
        return data.bookmarks.slice();
    }


    /* ------------- resume ------------- */

    function setLast(trackId, lessonId, section) {

        data.last = {
            trackId,
            lessonId,
            section: section || 0
        };

        save();
    }


    function getLast() {
        return data.last;
    }


    /* ------------- calculations -------------
       Only published ('ready') lessons count.
       Progress comes from real completion records. */

    function publishedLessons(track) {

        return (track.lessons || []).filter(
            lesson => lesson.status === 'ready'
        );
    }


    function trackProgress(track) {

        const published = publishedLessons(track);

        const done = published.filter(
            lesson => isCompleted(lesson.id)
        ).length;

        return {
            done,
            total: published.length,
            planned: (track.lessons || []).length,
            percent:
                published.length > 0
                    ? Math.round((done / published.length) * 100)
                    : 0
        };
    }


    function overallProgress(tracks) {

        let done = 0;
        let total = 0;

        tracks.forEach(track => {
            const p = trackProgress(track);
            done += p.done;
            total += p.total;
        });

        return {
            done,
            total,
            percent:
                total > 0
                    ? Math.round((done / total) * 100)
                    : 0
        };
    }


    function reset() {
        data = empty();
        save();
    }


    return {
        isCompleted,
        markCompleted,
        isBookmarked,
        toggleBookmark,
        getBookmarks,
        setLast,
        getLast,
        trackProgress,
        overallProgress,
        reset
    };

})();
