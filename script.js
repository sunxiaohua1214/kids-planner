// 等待整个HTML文档加载并解析完成后再执行脚本
document.addEventListener('DOMContentLoaded', () => {

    // --- 获取需要操作的DOM元素 ---
    const taskInput = document.getElementById('taskInput'); // 任务输入框
    const timeInput = document.getElementById('timeInput'); // 时间输入框
    const addTaskBtn = document.getElementById('addTaskBtn'); // 添加任务按钮
    const todoList = document.getElementById('todoList'); // 待办任务列表 (ul)
    const completedList = document.getElementById('completedList'); // 已完成任务列表 (ul)
    const feedbackMessage = document.getElementById('feedbackMessage'); // 底部浮动提示框

    // 计时器相关元素
    const timerDisplay = document.getElementById('timerDisplay'); // 计时器显示区域
    const startPauseBtn = document.getElementById('startPauseBtn'); // 开始/暂停按钮
    const resetBtn = document.getElementById('resetBtn'); // 重置按钮

    // 困难点记录和历史回顾相关元素
    const difficultPointsInput = document.getElementById('difficultPoints'); // 困难点输入文本域
    const saveDaySummaryBtn = document.getElementById('saveDaySummaryBtn'); // 保存今日总结按钮
    const viewHistoryBtn = document.getElementById('viewHistoryBtn'); // 查看历史记录按钮 (现在是 显示全部/刷新 按钮)
    const historyLog = document.getElementById('historyLog'); // 显示历史记录的区域
    const historySearchInput = document.getElementById('historySearchInput'); // **** 新增：获取搜索框 ****

    // --- 计时器功能变量 ---
    let timerInterval = null; // 用于存储 setInterval 的ID，方便清除
    let totalSeconds = 0; // 计时器总秒数
    let timerRunning = false; // 计时器是否正在运行

    // --- 任务管理功能 ---

    // 事件监听：点击“添加任务”按钮
    addTaskBtn.addEventListener('click', () => {
        const taskText = taskInput.value.trim(); // 获取任务文本并去除首尾空格
        const taskTime = timeInput.value.trim(); // 获取预估时间文本

        // 输入验证
        if (taskText === '') {
            showFeedback('请先输入任务内容哦！', 'error'); // 提示用户输入
            return; // 阻止继续执行
        }

        // 调用函数添加任务到列表
        addTaskToDOM(taskText, taskTime);
        taskInput.value = ''; // 清空任务输入框
        timeInput.value = ''; // 清空时间输入框
        showFeedback('新挑战已添加！开始冒险吧！🚀', 'success'); // 显示成功提示
    });

    // 事件监听：使用事件委托处理任务列表中的点击事件 (优化性能)
    todoList.addEventListener('click', handleListClick);
    completedList.addEventListener('click', handleListClick);

    // 统一处理列表项点击事件的函数
    function handleListClick(event) {
        const target = event.target; // 获取被点击的元素
        const taskItem = target.closest('li'); // 找到被点击元素所在的列表项 (li)

        if (!taskItem) return; // 如果点击的不是列表项内的元素，则忽略

        // 判断点击的是否是复选框
        if (target.type === 'checkbox') {
            toggleTaskCompletion(taskItem, target.checked); // 调用切换完成状态的函数
        }
        // 判断点击的是否是删除按钮
        else if (target.classList.contains('delete-btn')) {
            // 弹出确认框，防止误删
            if (confirm('确定要删除这个任务吗？')) {
                deleteTask(taskItem); // 调用删除任务的函数
                showFeedback('任务已移除。', 'info'); // 显示提示
            }
        }
    }

    // 将新任务添加到待办列表的DOM结构中
    function addTaskToDOM(text, time) {
        const li = document.createElement('li'); // 创建一个新的列表项元素
        li.innerHTML = `
            <input type="checkbox">
            <span class="task-text">${text}</span>
            ${time ? `<span class="task-time">(${time}分钟)</span>` : ''} <!-- 如果有时间则显示 -->
            <button class="delete-btn">🗑️</button>
        `;
        // 将任务文本和时间存储到 li 元素的 dataset 中，方便后续读取
        li.dataset.text = text;
        li.dataset.time = time || ''; // 如果没有输入时间，则存储空字符串

        todoList.appendChild(li); // 将新列表项添加到待办列表中
    }

    // 切换任务的完成状态
    function toggleTaskCompletion(taskItem, isCompleted) {
        if (isCompleted) {
            // 标记为完成
            taskItem.classList.add('completed'); // 添加完成样式类
            completedList.appendChild(taskItem); // 将任务项移动到已完成列表
            triggerConfetti(); // 触发庆祝动画
            showFeedback('太棒了！成功攻克一个挑战！🎉', 'success'); // 显示鼓励语
        } else {
            // 从已完成状态取消标记
            taskItem.classList.remove('completed'); // 移除完成样式类
            todoList.appendChild(taskItem); // 将任务项移回待办列表
            showFeedback('任务已移回待办。', 'info'); // 显示提示
        }
    }

     // 从DOM中删除任务项
     function deleteTask(taskItem) {
        taskItem.remove(); // 直接移除元素
    }

    // --- 计时器功能 ---

    // 事件监听：点击“开始/暂停”按钮
    startPauseBtn.addEventListener('click', () => {
        if (timerRunning) {
            pauseTimer(); // 如果正在运行，则暂停
        } else {
            startTimer(); // 如果已暂停或未开始，则开始
        }
    });

    // 事件监听：点击“重置”按钮
    resetBtn.addEventListener('click', resetTimer);

    // 开始计时器
    function startTimer() {
        if (timerRunning) return; // 防止重复启动
        timerRunning = true;
        startPauseBtn.textContent = '⏸️ 暂停'; // 更新按钮文字
        // 设置定时器，每秒执行一次
        timerInterval = setInterval(() => {
            totalSeconds++; // 总秒数加1
            updateTimerDisplay(); // 更新显示
        }, 1000);
    }

    // 暂停计时器
    function pauseTimer() {
        if (!timerRunning) return; // 如果没在运行，则不执行
        timerRunning = false;
        startPauseBtn.textContent = '▶️ 继续'; // 更新按钮文字
        clearInterval(timerInterval); // 清除定时器
        timerInterval = null; // 重置定时器ID
    }

    // 重置计时器
    function resetTimer() {
        pauseTimer(); // 先确保计时器已暂停
        totalSeconds = 0; // 总秒数归零
        updateTimerDisplay(); // 更新显示为 00:00
        startPauseBtn.textContent = '▶️ 开始'; // 重置按钮文字为“开始”
    }

    // 更新计时器显示 (格式化为 MM:SS)
    function updateTimerDisplay() {
        const minutes = Math.floor(totalSeconds / 60); // 计算分钟数
        const seconds = totalSeconds % 60; // 计算秒数
        // 使用 padStart 补零，确保始终是两位数
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- 困难点记录与历史回顾功能 (MVP核心) ---

    // 事件监听：点击“保存今日总结”按钮
    saveDaySummaryBtn.addEventListener('click', saveSummary);

    // 保存当天总结到浏览器的 localStorage
    function saveSummary() {
        const difficulties = difficultPointsInput.value.trim(); // 获取困难点描述
        const completedTaskElements = completedList.querySelectorAll('li'); // 获取所有已完成的任务项
        const completedTasks = []; // 用于存储已完成任务信息的数组

        // 遍历已完成的任务项，提取信息
        completedTaskElements.forEach(li => {
            completedTasks.push({
                text: li.dataset.text, // 从 dataset 读取任务文本
                time: li.dataset.time  // 从 dataset 读取时间
            });
        });

        // 如果既没有完成任务，也没有记录困难点，则提示用户
        if (completedTasks.length === 0 && difficulties === '') {
             showFeedback('还没有完成的任务或记录困难点哦~', 'info');
             return;
        }

        // 构建当天总结的对象
        const todaySummary = {
            date: new Date().toLocaleDateString('zh-CN'), // 使用中文本地化日期格式 (例如 "2023/10/27")
            completedTasks: completedTasks, // 已完成任务数组
            difficulties: difficulties // 困难点描述
        };

        // 从 localStorage 读取已有的历史记录
        let history = []; // 初始化历史记录数组
        try {
            const storedHistory = localStorage.getItem('learningHistory'); // 读取数据
            if (storedHistory) {
                history = JSON.parse(storedHistory); // 解析 JSON 字符串为数组
                // 健壮性检查：确保解析结果确实是数组
                if (!Array.isArray(history)) {
                    console.warn("localStorage 中的 'learningHistory' 不是一个有效的数组，将重置。");
                    history = [];
                }
            }
        } catch (error) {
            // 处理读取或解析 localStorage 可能发生的错误
            console.error("读取或解析localStorage失败:", error);
            history = []; // 出错时，将历史记录重置为空数组，避免后续操作失败
        }

        // 将今天的总结添加到历史记录数组的末尾
        history.push(todaySummary);

        // 将更新后的完整历史记录数组写回 localStorage
        try {
            localStorage.setItem('learningHistory', JSON.stringify(history)); // 序列化为 JSON 字符串并存储
            showFeedback('今日总结已成功保存！继续加油！💪', 'success'); // 显示成功提示
            difficultPointsInput.value = ''; // 清空困难点输入框
            // **** 保存总结后，刷新一下历史记录显示（如果正在搜索可能不会立即看到新的）****
            loadAndDisplayHistory(historySearchInput.value); // 用当前的搜索词刷新
        } catch (error) {
             // 处理写入 localStorage 可能发生的错误（例如存储空间已满）
             console.error("写入localStorage失败:", error);
             showFeedback('保存失败，可能是浏览器存储空间已满。', 'error');
        }
    }

    // 从 localStorage 加载并显示历史记录 (包含搜索过滤功能)
    function loadAndDisplayHistory(searchTerm = '') {
        historyLog.innerHTML = ''; // 清空当前显示的历史记录

        let history = []; // 初始化历史记录数组
         try {
            const storedHistory = localStorage.getItem('learningHistory'); // 读取数据
            if (storedHistory) {
                history = JSON.parse(storedHistory); // 解析 JSON
                if (!Array.isArray(history)) { // 健壮性检查
                    history = [];
                }
            }
        } catch (error) {
            console.error("读取或解析localStorage失败:", error);
            history = []; // 出错时重置
        }

        // 检查是否有历史记录（过滤前）
        if (history.length === 0) {
            historyLog.innerHTML = '<p>还没有历史记录哦，快去完成任务并记录总结吧！</p>'; // 显示提示信息
            return;
        }

        // **** 根据 searchTerm 过滤历史记录 ****
        const lowerSearchTerm = searchTerm.trim().toLowerCase(); // 将搜索词转为小写并去除首尾空格
        const filteredHistory = history.filter(entry => {
            if (!lowerSearchTerm) {
                return true; // 如果搜索词为空，则显示所有记录
            }
            // 检查日期、已完成任务文本、困难点描述中是否包含搜索词（忽略大小写）
            try { // 添加 try...catch 以防 entry 结构不完整导致错误
                const dateMatch = entry.date?.includes(lowerSearchTerm) || false;
                const tasksText = entry.completedTasks?.map(task => task.text).join(' ').toLowerCase() || '';
                const tasksMatch = tasksText.includes(lowerSearchTerm);
                const difficultiesMatch = entry.difficulties?.toLowerCase().includes(lowerSearchTerm) || false;
                return dateMatch || tasksMatch || difficultiesMatch; // 任何一个匹配即可
            } catch (filterError) {
                console.error("过滤历史记录时出错:", filterError, "条目:", entry);
                return false; // 出错的条目不显示
            }
        });

        // **** 检查过滤后是否有结果 ****
        if (filteredHistory.length === 0) {
            if (lowerSearchTerm) {
                // 如果有搜索词但没有结果
                 historyLog.innerHTML = `<p>没有找到包含“${searchTerm}”的历史记录。</p>`;
            } else {
                 // 如果原本就没有历史记录（理论上前面已处理，但加一道保险）
                 historyLog.innerHTML = '<p>还没有历史记录哦。</p>';
            }
             return;
        }

        // **** 遍历过滤后的数组 filteredHistory ****
        filteredHistory.slice().reverse().forEach(entry => {
            const entryDiv = document.createElement('div'); // 为每条记录创建一个 div
            entryDiv.classList.add('history-entry'); // 添加样式类

            // 格式化已完成任务列表的显示文本
            let completedTasksHtml = '无'; // 默认文本
            if (entry.completedTasks && entry.completedTasks.length > 0) {
                 completedTasksHtml = entry.completedTasks.map(task =>
                    `${task.text || '未知任务'}${task.time ? ` (${task.time}分钟)` : ''}` // 增加健壮性
                 ).join('； '); // 使用中文分号分隔多个任务
            }

            // 格式化困难点描述的显示文本 (将换行符 \n 替换为 <br> 以在HTML中换行)
            const difficultiesHtml = entry.difficulties ? entry.difficulties.replace(/\n/g, '<br>') : '无记录';

            // 设置条目的内部 HTML
            entryDiv.innerHTML = `
                <h3>📅 ${entry.date || '未知日期'}</h3> <!-- 增加健壮性 -->
                <p><strong>✅ 完成的任务：</strong> ${completedTasksHtml}</p>
                <p><strong>🤔 遇到的难题：</strong> ${difficultiesHtml}</p>
            `;
            historyLog.appendChild(entryDiv); // 将条目添加到历史记录区域
        });
    }

    // **** 新增：监听搜索框的输入事件 ****
    historySearchInput.addEventListener('input', () => {
        // 当用户在搜索框中输入时，立即调用 loadAndDisplayHistory 并传入当前的搜索词
        loadAndDisplayHistory(historySearchInput.value);
    });

    // **** 修改：“显示全部/刷新”按钮的事件监听器 ****
    viewHistoryBtn.addEventListener('click', () => {
        historySearchInput.value = ''; // 清空搜索框的内容
        loadAndDisplayHistory(); // 调用函数，不传参数，显示全部历史记录
        showFeedback('已显示全部历史记录。', 'info'); // 给个提示
    });


    // --- 辅助功能 ---

    let feedbackTimeout; // 用于存储 setTimeout 的 ID，方便清除
    // 显示底部浮动反馈消息
    function showFeedback(message, type = 'info') { // type 参数暂时未使用，可用于未来扩展不同颜色的提示
        feedbackMessage.textContent = message; // 设置提示文本
        feedbackMessage.classList.add('show'); // 添加 'show' 类使其可见

        // 如果之前有提示正在显示，清除它的隐藏计时器
        clearTimeout(feedbackTimeout);

        // 设置定时器，在 3 秒后自动隐藏提示
        feedbackTimeout = setTimeout(() => {
            feedbackMessage.classList.remove('show'); // 移除 'show' 类使其消失
        }, 3000);
    }

    // 触发 Canvas Confetti 庆祝动画
    function triggerConfetti() {
        // 调用 confetti 库函数
        confetti({
            particleCount: 100, // 粒子数量
            spread: 70, // 散开角度
            origin: { y: 0.6 } // 发射源的垂直位置 (0 是顶部, 1 是底部)
        });
    }

    // --- 页面加载时需要执行的操作 ---
    loadAndDisplayHistory(); // **** 确保页面加载时自动加载并显示历史记录 ****

}); // DOMContentLoaded 事件监听器结束
