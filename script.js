// 註冊 Chart.js 外掛
Chart.register(ChartDataLabels, window['chartjs-plugin-annotation']);

// 獲取 DOM 元素 - 單一分析
const startInput = document.getElementById('startInput');
const btnCalc = document.getElementById('btnCalc');
const btnReset = document.getElementById('btnReset');
const statusOutput = document.getElementById('statusOutput');
const infoTitle = document.getElementById('infoTitle');
const infoStart = document.getElementById('infoStart');
const infoLength = document.getElementById('infoLength');
const infoMax = document.getElementById('infoMax');
const seqLabel = document.getElementById('seqLabel');
const infoSequence = document.getElementById('infoSequence');
const successBadge = document.getElementById('successBadge');
const ctx = document.getElementById('collatzChart').getContext('2d');
const themeToggle = document.getElementById('themeToggle');

// 獲取 DOM 元素 - 範圍分析
const rangeStartInput = document.getElementById('rangeStartInput');
const rangeEndInput = document.getElementById('rangeEndInput');
const btnRangeCalc = document.getElementById('btnRangeCalc');
const btnRangeReset = document.getElementById('btnRangeReset');
const rangeStatusOutput = document.getElementById('rangeStatusOutput');
const rangeCtx = document.getElementById('rangeChart').getContext('2d');
const detailsGrid = document.getElementById('detailsGrid');

// 獲取 DOM 元素 - 範圍統計卡片
const statAvgSteps = document.getElementById('statAvgSteps');
const statMaxSteps = document.getElementById('statMaxSteps');
const statMaxStepsNum = document.getElementById('statMaxStepsNum');
const statMaxPeak = document.getElementById('statMaxPeak');
const statMaxPeakNum = document.getElementById('statMaxPeakNum');

// 狀態變數
let chartInstance = null;
let rangeChartInstance = null;
let currentStartValue = 7; // 紀錄目前運算的值，方便切換主題時重繪
let currentRangeStart = null;
let currentRangeEnd = null;
let currentRangeChartType = 'paths'; // 'paths' | 'compare'

// 主題輔助函數
function getInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        return savedTheme;
    }
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// 取得當前主題專屬的圖表色彩
function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        isDark: isDark,
        lineColor: isDark ? '#a855f7' : '#6366f1',
        lineBgColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(99, 102, 241, 0.08)',
        pointBg: isDark ? '#a855f7' : '#6366f1',
        pointBorder: isDark ? '#110926' : '#ffffff',
        datalabelColor: isDark ? '#b3a5cf' : '#475569',
        annotationColor: isDark ? '#34d399' : '#10b981',
        gridColor: isDark ? '#231645' : '#f1f5f9',
        tickColor: isDark ? '#94a3b8' : '#64748b',
        titleColor: isDark ? '#f3efff' : '#0f172a'
    };
}

// 初始化應用主題
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

// 主題切換點擊事件
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    
    // 切換後重繪單一圖表
    updateDashboard(currentStartValue);
    
    // 切換後重繪範圍圖表 (如果有運算過數據)
    if (currentRangeStart !== null && currentRangeEnd !== null) {
        const allSequences = [];
        for (let i = currentRangeStart; i <= currentRangeEnd; i++) {
            const seq = generateCollatzSequence(i);
            allSequences.push({
                start: i,
                sequence: seq,
                length: seq.length,
                peak: Math.max(...seq)
            });
        }
        renderRangeChart(allSequences);
    }
});

// 克拉茲猜想核心演算法
function generateCollatzSequence(n) {
    let sequence = [n];
    while (n > 1) {
        if (n % 2 === 0) {
            n = n / 2;
        } else {
            n = 3 * n + 1;
        }
        sequence.push(n);
    }
    return sequence;
}

// 初始化與更新圖表函數
function updateDashboard(startValue) {
    if (startValue < 1 || isNaN(startValue)) {
        alert("請輸入大於或等於 1 的正整數！");
        return;
    }

    currentStartValue = startValue; // 更新目前運算值紀錄

    // 計算數據
    const seq = generateCollatzSequence(startValue);
    const stepsCount = seq.length; 
    const maxVal = Math.max(...seq);

    // 更新文字面板資訊
    statusOutput.innerText = `已完成 (n=${startValue})`;
    infoTitle.innerText = `序列資訊 (n=${startValue})`;
    infoStart.innerText = `n = ${startValue}`;
    infoLength.innerText = stepsCount;
    infoMax.innerText = maxVal;
    seqLabel.innerText = `完整序列 (n=${startValue}):`;
    infoSequence.innerText = seq.join(', ');
    successBadge.style.display = 'inline-block';

    // 建立 X 軸 Label (1 到 N 步)
    const labels = seq.map((_, index) => index + 1);

    // 如果原有圖表存在，先將其銷毀以防記憶體洩漏與渲染重疊
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 取得當前主題對應的圖表色彩設定
    const colors = getThemeColors();

    // 重新繪製 Chart
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'n 的值',
                data: seq,
                borderColor: colors.lineColor,
                backgroundColor: colors.lineBgColor,
                borderWidth: 2.5,
                pointBackgroundColor: colors.pointBg,
                pointBorderColor: colors.pointBorder,
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true, // 開啟背景填充，更具現代儀表板感
                tension: 0.15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 25, // 留出頂部空間給最高點嘅數字 Label 顯示
                    right: 15
                }
            },
            plugins: {
                legend: {
                    display: false // 隱藏頂部圖例
                },
                tooltip: {
                    backgroundColor: colors.isDark ? '#1a0f38' : '#ffffff',
                    titleColor: colors.isDark ? '#f3efff' : '#0f172a',
                    bodyColor: colors.isDark ? '#b3a5cf' : '#475569',
                    borderColor: colors.gridColor,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            return `步驟: ${context[0].label}`;
                        },
                        label: function(context) {
                            return `值 (n): ${context.raw}`;
                        }
                    }
                },
                // 點對點數值標籤 (chartjs-plugin-datalabels)
                datalabels: {
                    align: 'top',
                    offset: 4,
                    font: {
                        size: 11,
                        weight: '600',
                        family: "'Plus Jakarta Sans', sans-serif"
                    },
                    color: colors.datalabelColor,
                    formatter: function(value) {
                        return value;
                    }
                },
                // 底部輔助線 (chartjs-plugin-annotation)
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 1,
                            yMax: 1,
                            borderColor: colors.annotationColor,
                            borderWidth: 1.5,
                            borderDash: [4, 4],
                            label: {
                                display: true,
                                content: '最終達到 1',
                                position: 'start',
                                backgroundColor: colors.isDark ? 'rgba(17, 9, 38, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                color: colors.annotationColor,
                                font: {
                                    size: 11,
                                    weight: 'bold',
                                    family: "'Plus Jakarta Sans', sans-serif"
                                },
                                yAdjust: -12
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '步驟 (Steps)',
                        font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                        color: colors.titleColor
                    },
                    grid: {
                        display: true,
                        color: colors.gridColor
                    },
                    ticks: {
                        color: colors.tickColor,
                        font: { family: "'Plus Jakarta Sans', sans-serif" }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'n 的值 (Value of n)',
                        font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                        color: colors.titleColor
                    },
                    grid: {
                        color: colors.gridColor
                    },
                    ticks: {
                        color: colors.tickColor,
                        font: { family: "'Plus Jakarta Sans', sans-serif" }
                    },
                    beginAtZero: true,
                    suggestedMax: Math.ceil(maxVal * 1.1) // 動態微調 Y 軸最大上限
                }
            }
        }
    });
}

// 事件監聽：開始運算
btnCalc.addEventListener('click', () => {
    const val = parseInt(startInput.value, 10);
    updateDashboard(val);
});

// 支援 Enter 鍵觸發計算
startInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const val = parseInt(startInput.value, 10);
        updateDashboard(val);
    }
});

// 事件監聽：重置
btnReset.addEventListener('click', () => {
    startInput.value = 7;
    updateDashboard(7);
});

// --- 分頁切換 (Tab Switching) 邏輯 ---
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

function switchTab(tabId) {
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    // 解決 Chart.js 在隱藏容器中 resize 的問題
    if (tabId === 'single' && chartInstance) {
        chartInstance.resize();
    } else if (tabId === 'range' && rangeChartInstance) {
        rangeChartInstance.resize();
    }
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
    });
});

// --- 範圍數值運算與渲染邏輯 ---

function updateRangeDashboard(start, end) {
    if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
        alert("請輸入大於或等於 1 的正整數！");
        return;
    }
    if (start > end) {
        alert("起始正整數不能大於結束正整數！");
        return;
    }
    if (end - start > 99) {
        alert("為了維護瀏覽器效能與圖表易讀性，範圍大小請限制在 100 以內。");
        return;
    }

    currentRangeStart = start;
    currentRangeEnd = end;

    const allSequences = [];
    let totalLength = 0;
    let maxSteps = -1;
    let maxStepsStartNum = -1;
    let maxPeak = -1;
    let maxPeakStartNum = -1;

    for (let i = start; i <= end; i++) {
        const seq = generateCollatzSequence(i);
        const length = seq.length; // 以序列長度 (步驟數 + 1) 表示
        const peak = Math.max(...seq);

        allSequences.push({
            start: i,
            sequence: seq,
            length: length,
            peak: peak
        });

        totalLength += length;
        if (length > maxSteps) {
            maxSteps = length;
            maxStepsStartNum = i;
        }
        if (peak > maxPeak) {
            maxPeak = peak;
            maxPeakStartNum = i;
        }
    }

    const avgSteps = (totalLength / allSequences.length).toFixed(1);

    // 更新統計面板資訊
    statAvgSteps.innerText = `${avgSteps} 步`;
    statMaxSteps.innerText = `${maxSteps} 步`;
    statMaxStepsNum.innerText = `數值：n = ${maxStepsStartNum}`;
    statMaxPeak.innerText = maxPeak;
    statMaxPeakNum.innerText = `數值：n = ${maxPeakStartNum}`;

    rangeStatusOutput.innerText = `已完成 (n=${start}~${end})`;

    // 渲染明細卡片與圖表
    renderDetailsGrid(allSequences);
    renderRangeChart(allSequences);
}

// 渲染明細網格
function renderDetailsGrid(allSequences) {
    detailsGrid.innerHTML = '';
    allSequences.forEach(item => {
        const card = document.createElement('div');
        card.className = 'detail-card';
        card.innerHTML = `
            <div class="detail-num">${item.start}</div>
            <div class="detail-meta">
                <span>長度: ${item.length}</span>
                <span>峰值: ${item.peak}</span>
            </div>
        `;
        card.addEventListener('click', () => {
            switchTab('single');
            startInput.value = item.start;
            updateDashboard(item.start);
        });
        detailsGrid.appendChild(card);
    });
}

// 渲染範圍圖表
function renderRangeChart(allSequences) {
    if (rangeChartInstance) {
        rangeChartInstance.destroy();
    }

    const colors = getThemeColors();
    const isDark = colors.isDark;

    if (currentRangeChartType === 'paths') {
        // --- 模式一：收斂軌跡折線圖 (Paths) ---
        const maxLength = Math.max(...allSequences.map(s => s.sequence.length));
        const labels = Array.from({ length: maxLength }, (_, idx) => idx + 1);

        const datasets = allSequences.map((item, idx) => {
            // HSL 均勻分佈配色，使多條折線易於區分
            const hue = (idx * 360) / allSequences.length;
            const lineColor = `hsl(${hue}, 70%, ${isDark ? '60%' : '50%'})`;

            return {
                label: `n = ${item.start}`,
                data: item.sequence,
                borderColor: lineColor,
                backgroundColor: 'transparent',
                borderWidth: allSequences.length > 25 ? 1.2 : 2.2,
                pointRadius: allSequences.length > 25 ? 0.5 : 2.5,
                pointHoverRadius: 5,
                fill: false,
                tension: 0.15
            };
        });

        document.getElementById('rangeChartTitle').innerText = `範圍數值收斂軌跡 (${allSequences[0].start}~${allSequences[allSequences.length - 1].start})`;

        rangeChartInstance = new Chart(rangeCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 15, right: 15 }
                },
                plugins: {
                    legend: {
                        display: allSequences.length <= 15, // 線條過多時隱藏圖例以防雜亂
                        position: 'top',
                        labels: {
                            color: colors.tickColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1a0f38' : '#ffffff',
                        titleColor: isDark ? '#f3efff' : '#0f172a',
                        bodyColor: isDark ? '#b3a5cf' : '#475569',
                        borderColor: colors.gridColor,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return `步驟: ${context[0].label}`;
                            }
                        }
                    },
                    // 軌跡圖關閉數值標籤以防完全重疊
                    datalabels: {
                        display: false
                    },
                    // 底部收斂輔助線
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 1,
                                yMax: 1,
                                borderColor: colors.annotationColor,
                                borderWidth: 1.5,
                                borderDash: [4, 4],
                                label: {
                                    display: true,
                                    content: '最終達到 1',
                                    position: 'start',
                                    backgroundColor: isDark ? 'rgba(17, 9, 38, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    color: colors.annotationColor,
                                    font: {
                                        size: 11,
                                        weight: 'bold',
                                        family: "'Plus Jakarta Sans', sans-serif"
                                    },
                                    yAdjust: -12
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '步驟 (Steps)',
                            font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                            color: colors.titleColor
                        },
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.tickColor, font: { family: "'Plus Jakarta Sans', sans-serif" } }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'n 的值 (Value of n)',
                            font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                            color: colors.titleColor
                        },
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.tickColor, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        // --- 模式二：步數與峰值雙軸圖 (Steps & Peaks) ---
        const labels = allSequences.map(item => `n = ${item.start}`);
        const lengths = allSequences.map(item => item.length);
        const peaks = allSequences.map(item => item.peak);

        document.getElementById('rangeChartTitle').innerText = `範圍數值收斂步數與最大值對比 (${allSequences[0].start}~${allSequences[allSequences.length - 1].start})`;

        rangeChartInstance = new Chart(rangeCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: '序列長度 (步驟)',
                        data: lengths,
                        yAxisID: 'y',
                        backgroundColor: colors.lineColor,
                        borderColor: colors.lineColor,
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.55
                    },
                    {
                        type: 'line',
                        label: '最高峰值',
                        data: peaks,
                        yAxisID: 'y1',
                        borderColor: colors.annotationColor,
                        backgroundColor: 'transparent',
                        borderWidth: 2.5,
                        pointBackgroundColor: colors.annotationColor,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.15
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: colors.tickColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1a0f38' : '#ffffff',
                        titleColor: isDark ? '#f3efff' : '#0f172a',
                        bodyColor: isDark ? '#b3a5cf' : '#475569',
                        borderColor: colors.gridColor,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    },
                    datalabels: {
                        display: allSequences.length <= 15, // 數據較少時才標註數值
                        align: 'top',
                        offset: 2,
                        font: { size: 10, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
                        color: colors.datalabelColor,
                        formatter: function(value, context) {
                            // 僅為柱狀圖 dataset 標記長度，折線圖數值高低落差大不宜標記以維持美觀
                            return context.datasetIndex === 0 ? value : '';
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.tickColor, font: { family: "'Plus Jakarta Sans', sans-serif" } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '收斂步數 (長度)',
                            font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                            color: colors.titleColor
                        },
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.tickColor, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '最高峰值',
                            font: { weight: 'bold', family: "'Plus Jakarta Sans', sans-serif" },
                            color: colors.annotationColor
                        },
                        grid: { drawOnChartArea: false }, // 避免右側網格與左側重疊導致雜亂
                        ticks: { color: colors.tickColor, font: { family: "'Plus Jakarta Sans', sans-serif" } },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// --- 事件監聽器：範圍分析 ---

// 開始範圍運算
btnRangeCalc.addEventListener('click', () => {
    const startVal = parseInt(rangeStartInput.value, 10);
    const endVal = parseInt(rangeEndInput.value, 10);
    updateRangeDashboard(startVal, endVal);
});

// 支援 Enter 鍵觸發運算
rangeStartInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const startVal = parseInt(rangeStartInput.value, 10);
        const endVal = parseInt(rangeEndInput.value, 10);
        updateRangeDashboard(startVal, endVal);
    }
});
rangeEndInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const startVal = parseInt(rangeStartInput.value, 10);
        const endVal = parseInt(rangeEndInput.value, 10);
        updateRangeDashboard(startVal, endVal);
    }
});

// 範圍重置
btnRangeReset.addEventListener('click', () => {
    rangeStartInput.value = 5;
    rangeEndInput.value = 15;
    currentRangeStart = null;
    currentRangeEnd = null;

    statAvgSteps.innerText = '-';
    statMaxSteps.innerText = '-';
    statMaxStepsNum.innerText = '數值：-';
    statMaxPeak.innerText = '-';
    statMaxPeakNum.innerText = '數值：-';
    rangeStatusOutput.innerText = '未運算';
    detailsGrid.innerHTML = '';

    if (rangeChartInstance) {
        rangeChartInstance.destroy();
        rangeChartInstance = null;
    }
});

// 圖表類型切換
const toggleButtons = document.querySelectorAll('.chart-toggle-group .toggle-btn');
toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentRangeChartType = btn.getAttribute('data-chart-type');

        if (currentRangeStart !== null && currentRangeEnd !== null) {
            updateRangeDashboard(currentRangeStart, currentRangeEnd);
        }
    });
});

// 網頁加載完成後初始化
window.onload = () => {
    updateDashboard(7);
};
