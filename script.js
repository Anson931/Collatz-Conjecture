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

let chartInstance = null;

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

    // 重新繪製 Chart
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'n 的值',
                data: seq,
                borderColor: '#3a8bcd',
                backgroundColor: 'rgba(58, 139, 205, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#3a8bcd',
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: false,
                tension: 0.1
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
                    display: false // 隱藏頂部圖例以符合原圖
                },
                tooltip: {
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
                        weight: 'normal'
                    },
                    color: '#333',
                    formatter: function(value) {
                        return value;
                    }
                },
                // 底部綠色虛線輔助線 (chartjs-plugin-annotation)
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 1,
                            yMax: 1,
                            borderColor: '#28a745',
                            borderWidth: 1.5,
                            borderDash: [4, 4],
                            label: {
                                display: true,
                                content: '最終達到 1',
                                position: 'start',
                                backgroundColor: 'transparent',
                                color: '#28a745',
                                font: {
                                    size: 12,
                                    weight: 'bold'
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
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'n 的值 (Value of n)',
                        font: { weight: 'bold' }
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
