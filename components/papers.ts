export type Paper = {
  title: string
  year: number
  conference: string
  description: string
  file: string // 相对于 public/papers 的路径
}

export const papers: Paper[] = [
  {
    title: 'Loyalty-Aware Embedding Space Attack for Multi-Stage Dilemma',
    year: 2025,
    conference: 'AAAI 2026 (Under Review)',
    description: '提出路径对齐感知的攻击方法，揭示LLM道德轨迹漏洞。',
    file: '/papers/AAAI_26_LAESA__Loyalty_Aware_Embedding_Space_Attack.pdf',
  },
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
  {
    title: 'Probabilistic Quantum SVM with Quadratic Unconstrained Binary Optimization',
    year: 2025,
    conference: 'AAAI 2026 (Under Review)',
    description: '提出基于Boltzmann分布的概率训练方法。结合批处理与多批集成策略，缓解变量限制，支持多类分类任务，在大规模数据上实现高效鲁棒学习。',
    file: '/papers/AAAI26_Probabilistic_Quantum_SVM_with_Quadratic_Unconstrained_Binary_Optimization.pdf',
  },
]
