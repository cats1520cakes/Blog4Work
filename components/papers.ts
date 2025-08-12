export type Paper = {
  title: string
  year: number
  conference: string
  description: string
  file: string // 相对于 public/papers 的路径
}

export const papers: Paper[] = [
  {
    title: 'Edge Code Cloak Coder for Privacy-Preserving Code Agents',
    year: 2025,
    conference: 'EMNLP 2025 WiNLP Workshop',
    description: '在边缘设备实现代码匿名与验证，提升隐私保障的代码代理。 代码见 https://github.com/cats1520cakes/ECCC-Edge-Code-Cloak-Coder-for-Privacy-Preserving-Code-Agents',
    file: '/papers/EMNLP_WiNLP_workshop_ECCC__Edge_Code_Cloak_Coder_for_Privacy_Code_Agent.pdf',
  },
    {
    title: 'Q-Detection: A Quantum-Classical Hybrid Poisoning Attack Detection Method',
    year: 2025,
    conference: 'IJCAI 2025',
    description: '我们重新公式化前馈网络，通过特种硬件优化器加速恶意数据检测。代码见 https://github.com/cats1520cakes/Q-Detection-A-Quantum-Classical-Hybrid-Poisoning-Attack-Detection-Method',
    file: '/papers/Qdetection.pdf',
  },

]
