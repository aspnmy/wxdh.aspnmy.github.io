/**
 * ZUI 3.0 升级兼容脚本
 * 解决两个问题：
 *   1. Tab 切换失效：ZUI 3.0 CSS 中缺少 .tab-pane 的基础显示/隐藏样式，
 *      同时 Component.register() 的事件委托可能因脚本加载顺序导致 click 事件未绑定
 *   2. el-remove 占位内容未清理：原 chat.bundle.js 中 $('.el-remove').remove()
 *      可能因前面代码报错导致未执行
 * 
 * 本脚本会：
 *   - 注入 tab 相关的基础 CSS（display 控制）
 *   - 在 DOM ready 后为 [data-toggle="tab"] 绑定 click 事件
 *   - 独立执行 .el-remove 清理（用独立 try-catch 保护）
 */
(function ($) {
    'use strict';

    // -------- 注入 tab 相关基础 CSS --------
    var tabCss = [
        '.tab-content > .tab-pane { display: none; }',
        '.tab-content > .active { display: block; }',
        '.nav-tabs { border-bottom: 1px solid #ddd; list-style: none; padding-left: 0; margin-bottom: 15px; }',
        '.nav-tabs > li { display: inline-block; margin-bottom: -1px; position: relative; }',
        '.nav-tabs > li > a { display: block; padding: 10px 15px; border: 1px solid transparent; border-radius: 4px 4px 0 0; line-height: 1.42857143; text-decoration: none; color: #333; }',
        '.nav-tabs > li > a:hover { border-color: #eee #eee #ddd; background-color: #f5f5f5; }',
        '.nav-tabs > li.active > a { color: #555; background-color: #fff; border: 1px solid #ddd; border-bottom-color: transparent; cursor: default; font-weight: bold; }'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-zui-compat', 'tab');
    styleEl.textContent = tabCss;
    document.head.appendChild(styleEl);

    // -------- Tab 切换逻辑 --------
    function switchTab($tabLink) {
        var $navTabs = $tabLink.closest('.nav.nav-tabs');
        if (!$navTabs.length) return;

        var targetId = $tabLink.attr('href') || $tabLink.data('target');
        if (!targetId) return;

        var $targetPanel = $(targetId);
        if (!$targetPanel.length) return;

        // 切换 nav 链接 active 状态
        $navTabs.find('li').removeClass('active');
        $tabLink.parent('li').addClass('active');

        // 切换 tab-pane 显示
        $targetPanel.parent().children('.tab-pane').removeClass('active');
        $targetPanel.addClass('active');

        // 触发自定义事件
        $tabLink.trigger('shown.zui.tab', [targetId]);
    }

    // -------- DOM ready 后统一处理 --------
    $(function () {
        // 问题 1：为所有 [data-toggle="tab"] 绑定 click 事件
        $(document).on('click.zui.tabCompat', '[data-toggle="tab"]', function (e) {
            e.preventDefault();
            switchTab($(this));
        });

        // 问题 2：清理所有 el-remove 占位元素（独立 try-catch 保护）
        try {
            $('.el-remove').remove();
        } catch (err) {
            // 静默失败
        }

        // 初始化：激活默认 active 的 tab（确保页面加载后默认面板显示）
        var $activeLink = $('.nav.nav-tabs li.active a[data-toggle="tab"]');
        if ($activeLink.length) {
            var targetId = $activeLink.attr('href');
            if (targetId) {
                $(targetId).addClass('active');
            }
        } else {
            // 如果没有默认 active，则激活第一个 tab
            var $firstLink = $('.nav.nav-tabs li:first a[data-toggle="tab"]');
            if ($firstLink.length) {
                switchTab($firstLink);
            }
        }
    });
})(window.jQuery);
