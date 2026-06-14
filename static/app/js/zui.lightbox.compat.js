/**
 * ZUI 3.0 Lightbox 兼容组件
 * 由于 ZUI 3.0 移除了 lightbox 组件，此脚本提供一个简单的图片预览弹窗，
 * 兼容旧版 API: $('#element').lightbox({image, caption, modalTemplate})
 * 注意：同时兼容旧拼写 modalTeamplate
 */
(function ($) {
    'use strict';

    var DEFAULT_TEMPLATE =
        '<div class="zui-lightbox" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;justify-content:center;align-items:center;">' +
            '<button type="button" class="zui-lightbox-close" aria-hidden="true" ' +
                'style="position:absolute;top:20px;right:30px;background:none;border:none;color:#fff;font-size:42px;cursor:pointer;line-height:1;opacity:0.8;">×</button>' +
            '<div class="zui-lightbox-content" style="max-width:90%;max-height:90%;text-align:center;">' +
                '<img class="zui-lightbox-img" src="{image}" alt="" style="max-width:100%;max-height:80vh;display:block;margin:0 auto 15px;box-shadow:0 10px 40px rgba(0,0,0,0.5);" />' +
                '<div class="zui-lightbox-caption" style="color:#fff;font-size:14px;text-align:center;padding:0 20px;">{caption}</div>' +
            '</div>' +
        '</div>';

    var ESC_KEY_CODE = 27;

    /**
     * Lightbox 构造函数
     * @param {HTMLElement} element - 触发 lightbox 的元素
     * @param {Object} options - 配置项：{image, caption, modalTemplate/modalTeamplate}
     */
    var Lightbox = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Lightbox.DEFAULTS, options);
        this.isShown = false;
        this.$modal = null;
        this.init();
    };

    Lightbox.DEFAULTS = {
        image: null,
        caption: '',
        modalTemplate: null
    };

    /**
     * 初始化 lightbox：构建 DOM、绑定事件
     */
    Lightbox.prototype.init = function () {
        var self = this;
        // 兼容旧拼写 modalTeamplate（来自 ZUI 1.x 的遗留命名）
        var template = self.options.modalTemplate || self.options.modalTeamplate || DEFAULT_TEMPLATE;
        self.$modal = $(template
            .replace(/\{image\}/g, self.options.image || '')
            .replace(/\{caption\}/g, self.options.caption || '')
        );
        $('body').append(self.$modal);

        // 点击关闭按钮/图片关闭
        self.$modal.on('click.zui.lightbox', '.zui-lightbox-close, .zui-lightbox-img', function () {
            self.hide();
        });

        // 点击背景关闭
        self.$modal.on('click.zui.lightbox', function (e) {
            if (e.target === self.$modal[0] || $(e.target).hasClass('zui-lightbox-content')) {
                self.hide();
            }
        });

        // 触发元素点击显示
        self.$element.on('click.zui.lightbox', function (e) {
            e.preventDefault();
            self.show();
        });
    };

    /**
     * 显示 lightbox 并绑定 ESC 键监听
     */
    Lightbox.prototype.show = function () {
        var self = this;
        self.$modal.css({ display: 'flex', opacity: 0 });
        setTimeout(function () {
            self.$modal.css('opacity', 1);
        }, 10);
        self.isShown = true;
        // 仅在显示时绑定 ESC 监听，避免 document 上累积重复监听器
        $(document).on('keydown.zui.lightbox', function (e) {
            if (e.keyCode === ESC_KEY_CODE && self.isShown) {
                self.hide();
            }
        });
    };

    /**
     * 隐藏 lightbox 并移除 ESC 键监听
     */
    Lightbox.prototype.hide = function () {
        var self = this;
        self.$modal.css('opacity', 0);
        setTimeout(function () {
            self.$modal.css('display', 'none');
        }, 200);
        self.isShown = false;
        // 立即移除 document 上的 ESC 监听器，防止内存泄漏
        $(document).off('keydown.zui.lightbox');
    };

    /**
     * 销毁 lightbox：移除所有事件监听与 DOM
     */
    Lightbox.prototype.destroy = function () {
        this.hide();
        if (this.$modal) {
            this.$modal.off('.zui.lightbox').remove();
            this.$modal = null;
        }
        if (this.$element) {
            this.$element.off('.zui.lightbox');
        }
        $(document).off('keydown.zui.lightbox');
    };

    /**
     * 动态更新图片
     * @param {string} imageUrl - 图片 URL
     */
    Lightbox.prototype.setImage = function (imageUrl) {
        this.$modal.find('.zui-lightbox-img').attr('src', imageUrl);
    };

    /**
     * 动态更新说明文字
     * @param {string} caption - 说明文字（支持 HTML）
     */
    Lightbox.prototype.setCaption = function (caption) {
        this.$modal.find('.zui-lightbox-caption').html(caption);
    };

    // jQuery 插件注册
    var old = $.fn.lightbox;
    $.fn.lightbox = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('zui.lightbox');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('zui.lightbox', (data = new Lightbox(this, options)));
            }
            if (typeof option === 'string' && typeof data[option] === 'function') {
                data[option]();
            }
        });
    };

    $.fn.lightbox.Constructor = Lightbox;

    // 避免冲突
    $.fn.lightbox.noConflict = function () {
        $.fn.lightbox = old;
        return this;
    };
})(window.jQuery);
