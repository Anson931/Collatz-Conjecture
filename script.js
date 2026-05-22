// 註冊 Chart.js 外掛
Chart.register(ChartDataLabels, window['chartjs-plugin-annotation']);

// 獲取 DOM 元素
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

let chartInstance = null;
let currentStartValue = 7; // 紀錄目前運算的值，方便切換主題時重繪

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
    
    // 切換後重繪圖表
    updateDashboard(currentStartValue);
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

// 網頁加載完成後自動初始化執行一次 (n=7)
window.onload = () => {
    updateDashboard(7);
};
