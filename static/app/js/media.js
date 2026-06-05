/**
 * 媒体管理模块
 * 负责图片生成、GIF录制、屏幕录制、水印等第三方调用业务
 */
(function () {
    'use strict';

    // ========== 水印数据 ==========
    var WATERMARK_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MkI5REZEOEVGQTU3MTFFQUI2NTBBMTMwQTg4MTUwM0YiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkI5REZEOERGQTU3MTFFQUI2NTBBMTMwQTg4MTUwM0YiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RjFFMEJEMENGOTBCMTFFQUI2NTBBMTMwQTg4MTUwM0YiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RjFFMEJEMERGOTBCMTFFQUI2NTBBMTMwQTg4MTUwM0YiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4DaXOLAAA1WklEQVR42uydDXRc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';

    // ========== 工具函数 ==========
    /**
     * 创建 html2canvas onclone 回调：移除水印元素、video 标签和 base64 图片的 style 标签
     * @returns {function} onclone 回调函数
     */
    function createOnClone() {
        return function (clonedDoc) {
            $('.s' + window._d, clonedDoc).remove();
            $('video', clonedDoc).remove();
            $('style', clonedDoc).each(function () {
                if (-1 !== this.textContent.indexOf('data:image/png;base64')) {
                    this.remove();
                }
            });
        };
    }

    /**
     * Canvas 转图片 DataURL
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @returns {string} PNG 格式的 data URL
     */
    function canvas2image(canvas) {
        return canvas.toDataURL('png');
    }

    /**
     * 生成下载用的时间戳文件名
     * @returns {string} 微信聊天记录-YYYYMMDDHHMMSS.png
     */
    function generateFilename() {
        return '微信聊天记录_' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.png';
    }

    /**
     * 创建全屏预览弹窗
     * @param {string} imageUrl - 图片 URL
     * @param {boolean} isGif - 是否为 GIF 图片
     * @param {function} onBlobReady - 下载回调
     */
    function showPreviewModal(imageUrl, isGif, onBlobReady) {
        var labelText = isGif ? '点击此处下载GIF图片' : '点击此处下载图片';
        var overlay = $('<div>').css({
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,.85)', zIndex: 99999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer'
        }).appendTo('body');

        var img = $('<img>').attr('src', imageUrl).css({
            maxWidth: '90%', maxHeight: '75%',
            boxShadow: '0 0 20px rgba(0,0,0,.5)', borderRadius: '4px'
        }).appendTo(overlay);

        var label = $('<span>').text(labelText).css({
            color: '#fff', marginTop: '15px', fontSize: '14px', textDecoration: 'underline'
        }).appendTo(overlay);

        overlay.click(function (e) {
            if (e.target === overlay[0]) overlay.remove();
        });

        label.click(function (e) {
            e.stopPropagation();
            if (onBlobReady) onBlobReady();
        });
    }

    // ========== 截取与保存 ==========
    /**
     * 截取手机界面并保存为 PNG 图片
     * @param {Object} vueInstance - Vue 实例（this）
     */
    function saveSnapshot(vueInstance) {
        var self = vueInstance;
        self.__();

        var scrollTop = $('#phone').find('.phone-body').scrollTop();
        var clone = $('#phone').clone().addClass('iPhoneX').get(0);
        $('body').append(clone);
        $(clone).find('.phone-body').scrollTop(scrollTop);
        $('.content-wrapper').addClass('loading');

        setTimeout(function () {
            html2canvas(clone, {
                scale: 1,
                scrollY: 0,
                scrollX: 0,
                onclone: createOnClone()
            }).then(function (canvas) {
                var dataUrl = canvas2image(canvas);

                showPreviewModal(dataUrl, false, function () {
                    canvas.toBlob(function (blob) {
                        var url = URL.createObjectURL(blob);
                        var a = $('<a>').attr({
                            href: url,
                            download: generateFilename()
                        }).appendTo('body');
                        a[0].click();
                        a.remove();
                        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                    }, 'image/png');
                });

                $(clone).remove();
                $('.content-wrapper').removeClass('loading');
            });
        }, 200);
    }

    /**
     * 截取手机界面并保存为 GIF 图片
     * @param {string} gifUrl - GIF 的 Blob URL
     */
    function saveGif(gifUrl) {
        var scrollTop = $('#phone').find('.phone-body').scrollTop();
        var clone = $('#phone').clone().addClass('iPhoneX').get(0);
        $('body').append(clone);
        $(clone).find('.phone-body').scrollTop(scrollTop);
        $('.content-wrapper').addClass('loading');

        setTimeout(function () {
            html2canvas(clone, {
                scale: 1,
                scrollY: 0,
                scrollX: 0,
                onclone: createOnClone()
            }).then(function (canvas) {
                showPreviewModal(gifUrl, true, function () {
                    var a = $('<a>').attr({ href: gifUrl, download: '微信聊天图片_' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.gif' }).appendTo('body');
                    a[0].click();
                    a.remove();
                });

                $(clone).remove();
                $('.content-wrapper').removeClass('loading');
            });
        }, 200);
    }

    // ========== GIF 录制与视频录制 ==========
    /**
     * 初始化录制功能：GIF 录制与视频录制分离为独立流程
     *   - #downGif：GIF 生成（点击开始捕获帧 → 再次点击停止并渲染 → 再点击下载）
     *   - #btn-start-recording / #btn-stop-recording：视频录制
     * 在 Vue mounted 钩子中调用
     */
    function initRecording() {
        var elementToRecord = document.getElementById('element-to-record');

        // ===== GIF 录制（独立功能：通过 #downGif 按钮控制） =====
        var gif = new GIF({
            repeat: 0,
            workers: 4,
            quality: 30,
            workerScript: './static/app/js/gif.worker.js'
        });

        var gifCanvas = document.getElementById('background-canvas');
        var gifContext = gifCanvas.getContext('2d');
        gifCanvas.width = elementToRecord.clientWidth;
        gifCanvas.height = elementToRecord.clientHeight;

        var gifCapturing = false;
        var gifStopped = false;
        var gifUrl = null;
        var $gifBtn = $('#downGif');

        (function gifLooper() {
            if (!gifCapturing) {
                return setTimeout(gifLooper, 200);
            }
            html2canvas(elementToRecord, {
                onclone: createOnClone()
            }).then(function (canvas) {
                gifContext.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
                gifContext.drawImage(canvas, 0, 0, gifCanvas.width, gifCanvas.height);
                if (gifStopped) return;
                requestAnimationFrame(gifLooper);
                gif.addFrame(gifCanvas, { copy: true, delay: 120 });
            });
        })();

        gif.on('finished', function (blob) {
            gifUrl = URL.createObjectURL(blob);
            $gifBtn.removeClass('disabled').text('下载GIF');
            $gifBtn.off('click').on('click', function () {
                if (gifUrl) saveGif(gifUrl);
            });
        });

        $gifBtn.off('click').on('click', function gifToggle() {
            if ($(this).hasClass('disabled')) return;
            if (!gifCapturing) {
                // 开始捕获 GIF 帧
                gifCapturing = true;
                gifStopped = false;
                $(this).text('停止录制GIF');
            } else {
                // 停止捕获并渲染 GIF
                gifCapturing = false;
                gifStopped = true;
                $(this).text('正在合成GIF...').addClass('disabled');
                gif.render();
            }
        });

        // ===== 视频录制（独立功能：通过 #btn-start-recording/#btn-stop-recording 控制） =====
        var videoCanvas = document.createElement('canvas');
        videoCanvas.width = gifCanvas.width;
        videoCanvas.height = gifCanvas.height;
        var videoContext = videoCanvas.getContext('2d');

        var videoStream = videoCanvas.captureStream(120);
        var mime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4;' : 'video/webm;';
        var recorder = new MediaRecorder(videoStream, {
            videoBitsPerSecond: 8500000,
            mimeType: mime
        });
        var videoData = [];
        var videoRecording = false;

        document.getElementById('btn-start-recording').onclick = function () {
            this.disabled = true;
            document.getElementById('btn-stop-recording').disabled = false;
            videoRecording = true;
            videoData = [];

            recorder.ondataavailable = function (event) {
                if (event.data && event.data.size) {
                    videoData.push(event.data);
                }
            };
            recorder.start();

            (function videoLooper() {
                if (!videoRecording) return;
                html2canvas(elementToRecord, {
                    onclone: createOnClone()
                }).then(function (canvas) {
                    if (!videoRecording) return;
                    videoContext.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
                    videoContext.drawImage(canvas, 0, 0, videoCanvas.width, videoCanvas.height);
                    requestAnimationFrame(videoLooper);
                });
            })();
        };

        document.getElementById('btn-stop-recording').onclick = function () {
            var btn = this;
            videoRecording = false;
            recorder.onstop = function () {
                btn.disabled = true;
                document.getElementById('btn-start-recording').disabled = false;
                var url = URL.createObjectURL(new Blob(videoData, { type: mime }));
                document.getElementById('preview-video').parentNode.style.display = 'block';
                document.querySelector('#preview-video').src = url;
            };
            recorder.stop();
        };
    }

    // ========== 水印管理 ==========
    /**
     * 生成水印 CSS
     */
    function createWatermarkCSS(image) {
        return '<style>.s' + window._d + '{display: flex;align-items: center;justify-content: center;height: 100%;position: absolute;top: 0;width: 100%;overflow: hidden; background: url(data:image/png;base64,' + WATERMARK_IMAGE + image + ') repeat;}</style>';
    }

    /**
     * 应用或移除水印
     * @param {Object} vueInstance - Vue 实例
     */
    function applyWatermark(vueInstance) {
        var self = vueInstance;
        if (window.user && window.user.noMask) {
            $('.s' + window._d).remove();
        } else {
            var cls = 's' + window._d;
            if (!$('.' + cls).length) {
                $('head').append(createWatermarkCSS(self._()));
                var div = $('<div class="' + cls + '"></div>');
                $('.phone-bg').after(div);
            }
        }
    }

    /**
     * 定时刷新水印（每秒检查一次）
     * @param {Object} vueInstance - Vue 实例
     */
    function refreshWatermark(vueInstance) {
        var self = vueInstance;
        applyWatermark(self);
        setTimeout(function () {
            refreshWatermark(self);
        }, 1000);
    }

    // ========== 对外暴露 ==========
    window.MediaManager = {
        saveSnapshot: saveSnapshot,
        saveGif: saveGif,
        initRecording: initRecording,
        applyWatermark: applyWatermark,
        refreshWatermark: refreshWatermark,
        canvas2image: canvas2image,
        createOnClone: createOnClone
    };

})();