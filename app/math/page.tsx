import SectionHeader from '@/components/SectionHeader';
import MathNav from '@/components/math/MathNav';
import FormulaCard from '@/components/math/FormulaCard';

export default function MathPage() {
  return (
    <div>
      <SectionHeader
        label="MODULE 06"
        title="Mathematical Reference"
        description="Complete derivations and formulas underlying the NewRiskGraph quantitative engine, beautifully typeset."
      />

      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative' }}>
        <MathNav />

        <div style={{ flex: 1, paddingBottom: 100 }}>
          
          {/* SECTION 1 */}
          <div id="sec-1" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>1. Stochastic Processes</h2>
            
            <FormulaCard
              id="f-1a"
              title="1a. Geometric Brownian Motion (SDE)"
              formula="dS = \mu S\,dt + \sigma S\,dW_t"
              description="Asset price dynamics under the risk-neutral measure. μ is the drift (expected return), σ is volatility, W_t is a Wiener process (standard Brownian motion)."
              derivation={[
                { equation: "dS = \\mu S\\,dt + \\sigma S\\,dW_t", explanation: "[Itô SDE for GBM]" },
                { equation: "\\frac{dS}{S} = \\mu\\,dt + \\sigma\\,dW_t", explanation: "[divide both sides by S]" },
                { equation: "d(\\ln S) = \\left(\\mu - \\frac{\\sigma^2}{2}\\right)dt + \\sigma\\,dW_t", explanation: "[apply Itô's lemma to f=ln(S)]" },
                { equation: "\\ln S(t) = \\ln S(0) + \\left(\\mu - \\frac{\\sigma^2}{2}\\right)t + \\sigma W_t", explanation: "[integrate from 0 to t]" },
                { equation: "S(t) = S(0)\\exp\\!\\left[\\left(\\mu - \\frac{\\sigma^2}{2}\\right)t + \\sigma W_t\\right]", explanation: "[exponentiate to solve for S(t)]" }
              ]}
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }, { label: 'Price History', route: '/prices' }] }}
            />
            <FormulaCard
              id="f-1b"
              title="1b. Euler-Maruyama Discretization"
              formula="S_{t+1} = S_t \cdot \exp\!\left[\left(\mu - \frac{\sigma^2}{2}\right)\Delta t + \sigma\sqrt{\Delta t}\,Z\right], \quad Z \sim \mathcal{N}(0,1)"
              description="Discrete-time simulation of GBM. The Itô correction term −σ²/2 ensures E[S(t)] = S(0)e^{μt}, not S(0)e^{(μ+σ²/2)t}."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }, { label: 'Price History', route: '/prices' }] }}
            />
            <FormulaCard
              id="f-1c"
              title="1c. Itô's Lemma"
              formula="df = \left(\frac{\partial f}{\partial t} + \mu S\frac{\partial f}{\partial S} + \frac{1}{2}\sigma^2 S^2 \frac{\partial^2 f}{\partial S^2}\right)dt + \sigma S\frac{\partial f}{\partial S}\,dW_t"
              description="The fundamental theorem of stochastic calculus. Generalizes the chain rule to functions of Itô processes. The extra ½σ²S²∂²f/∂S² term arises because (dW)² = dt."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }] }}
            />
          </div>

          {/* SECTION 2 */}
          <div id="sec-2" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>2. Portfolio Theory</h2>
            <FormulaCard
              id="f-2a"
              title="2a. Portfolio Variance (Markowitz 1952)"
              formula="\sigma_p^2 = \mathbf{w}^\top \boldsymbol{\Sigma} \mathbf{w} = \sum_i \sum_j w_i w_j \sigma_{ij}"
              description="For weight vector w and covariance matrix Σ. Cross-terms enable diversification: when ρᵢⱼ < 1, portfolio risk is strictly less than the weighted sum of individual risks."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }, { label: 'Monte Carlo', route: '/monte-carlo' }] }}
            />
            <FormulaCard
              id="f-2b"
              title="2b. Diversification Ratio"
              formula="\mathrm{DR} = \frac{\sum_i w_i \sigma_i}{\sigma_p}"
              description="DR = 1 means zero diversification (perfect correlation). DR > 1 means diversification reduces portfolio risk below the weighted sum. Under full stress (α→1), DR→1."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
            <FormulaCard
              id="f-2c"
              title="2c. Sharpe Ratio"
              formula="\mathrm{SR} = \frac{\mathbb{E}[R_p] - r_f}{\sigma_p} \cdot \sqrt{\frac{252}{T}}"
              description="Risk-adjusted return. Annualized by √(252/T) where T is the simulation horizon in trading days. We use rf = 0 for simplicity (excess return = total return)."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }, { label: 'Price History', route: '/prices' }] }}
            />
          </div>

          {/* SECTION 3 */}
          <div id="sec-3" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>3. Graph Centrality</h2>
            <FormulaCard
              id="f-3a"
              title="3a. Eigenvector Centrality"
              formula="\mathbf{A}\mathbf{x} = \lambda_{\max}\mathbf{x} \implies x_i = \frac{1}{\lambda_{\max}}\sum_j A_{ij} x_j"
              description="Node importance proportional to the importance of its neighbors. Computed via power iteration: x ← Ax/‖Ax‖ repeated until convergence. Equivalent to the dominant eigenvector of the adjacency matrix."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }] }}
            />
            <FormulaCard
              id="f-3b"
              title="3b. Betweenness Centrality"
              formula="C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}"
              description="Fraction of all shortest paths that pass through vertex v. σ_st = total shortest paths from s to t, σ_st(v) = those passing through v. Computed via Brandes algorithm O(VE)."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }] }}
            />
            <FormulaCard
              id="f-3c"
              title="3c. GSVI — Graph-Weighted Systemic Vulnerability Index"
              formula="\mathrm{GSVI} = \sum_i w_i c_i, \quad c_i = \lambda_{\mathrm{eig}} \cdot c_{\mathrm{eig}}(i) + \lambda_{\mathrm{bet}} \cdot c_{\mathrm{bet}}(i)"
              description="Portfolio-weighted average of blended centrality scores. λ_eig = 0.6, λ_bet = 0.4. High GSVI = concentrated exposure to systemically important (bridge) assets."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }] }}
            />
          </div>

          {/* SECTION 4 */}
          <div id="sec-4" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>4. Spectral Risk</h2>
            <FormulaCard
              id="f-4a"
              title="4a. Spectral Risk Ratio"
              formula="\mathrm{SRR} = \frac{\lambda_{\max}}{\sum_i \lambda_i} = \frac{\lambda_{\max}}{n}"
              description="Since Tr(Σ) = n for a correlation matrix, Σλ_i = n. SRR measures the fraction of total variance explained by the dominant factor. Under Random Matrix Theory (Marchenko-Pastur), SRR > (1+√(n/T))²/n signals a true systemic factor."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }] }}
            />
            <FormulaCard
              id="f-4b"
              title="4b. Marchenko-Pastur Bounds"
              formula="\lambda_{\pm} = \sigma^2\!\left(1 \pm \sqrt{\frac{n}{T}}\right)^{\!2}"
              description="Eigenvalue bounds for a purely random n×T matrix (null hypothesis). Eigenvalues outside [λ₋, λ₊] carry genuine information. For n=10, T=252: λ₊ ≈ 1.84."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }] }}
            />
          </div>

          {/* SECTION 5 */}
          <div id="sec-5" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>5. Monte Carlo Methods</h2>
            <FormulaCard
              id="f-5a"
              title="5a. Cholesky Decomposition"
              formula="\boldsymbol{\Sigma} = \mathbf{L}\mathbf{L}^\top, \quad \mathbf{R} = \boldsymbol{\mu} + \mathbf{L}\mathbf{Z}, \quad \mathbf{Z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})"
              description="Factorize the covariance matrix into a lower triangular L. Multiplying iid standard normals Z by L induces the correct correlation structure. Standard error ∝ 1/√N."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }, { label: 'Stress Testing', route: '/stress' }] }}
            />
            <FormulaCard
              id="f-5b"
              title="5b. Box-Muller Transform"
              formula="Z_1 = \sqrt{-2\ln U_1}\cos(2\pi U_2), \quad Z_2 = \sqrt{-2\ln U_1}\sin(2\pi U_2)"
              description="Generates pairs of independent standard normal variates from uniform U₁,U₂ ~ Uniform(0,1). Used instead of inverse-CDF for numerical efficiency."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }, { label: 'Price History', route: '/prices' }] }}
            />
            <FormulaCard
              id="f-5c"
              title="5c. Value at Risk (VaR)"
              formula="\mathrm{VaR}_\alpha = -\inf\{x : F_{R_p}(x) > 1 - \alpha\} \approx -Q_{1-\alpha}(\{R_p^{(i)}\})"
              description="The α-quantile loss. VaR(95%) = the loss exceeded by only 5% of simulated paths. Not subadditive — does not account for tail shape."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }] }}
            />
            <FormulaCard
              id="f-5d"
              title="5d. Conditional Value at Risk (CVaR)"
              formula="\mathrm{CVaR}_\alpha = -\mathbb{E}\!\left[R_p \mid R_p < -\mathrm{VaR}_\alpha\right] = \frac{1}{(1-\alpha)}\int_0^{1-\alpha} \mathrm{VaR}_u\,du"
              description="The expected loss given that the loss exceeds VaR. Coherent risk measure (subadditive, convex). Always ≥ VaR. Computed as the mean of the worst (1−α)×N simulation outcomes."
              usedInConfig={{ links: [{ label: 'Monte Carlo', route: '/monte-carlo' }] }}
            />
          </div>

          {/* SECTION 6 */}
          <div id="sec-6" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>6. Stress Testing</h2>
            <FormulaCard
              id="f-6a"
              title="6a. PSD-Safe Stress Operator"
              formula="\boldsymbol{\Sigma}_s(\alpha) = (1-\alpha)\boldsymbol{\Sigma} + \alpha\boldsymbol{\Sigma}_{\max}, \quad \boldsymbol{\Sigma}_{\max} = \boldsymbol{\sigma}\boldsymbol{\sigma}^\top"
              description="Convex combination between realized covariance and the worst-case (all correlations = 1) matrix. Σ_max = σσᵀ is rank-1 PSD. By convexity, Σ_s is PSD for all α ∈ [0,1]."
              derivation={[
                { equation: "\\text{For any } \\mathbf{x} \\neq \\mathbf{0}: \\mathbf{x}^\\top\\boldsymbol{\\Sigma}_s\\mathbf{x} = (1-\\alpha)\\underbrace{\\mathbf{x}^\\top\\boldsymbol{\\Sigma}\\mathbf{x}}_{\\geq 0} + \\alpha\\underbrace{\\mathbf{x}^\\top\\boldsymbol{\\sigma}\\boldsymbol{\\sigma}^\\top\\mathbf{x}}_{=(\\boldsymbol{\\sigma}^\\top\\mathbf{x})^2 \\geq 0}", explanation: "Expand the quadratic form using the linear combination definition." },
                { equation: "\\text{Both terms } \\geq 0 \\text{ and } (1-\\alpha), \\alpha \\geq 0 \\implies \\mathbf{x}^\\top\\boldsymbol{\\Sigma}_s\\mathbf{x} \\geq 0 \\quad \\blacksquare", explanation: "Since the sum of two non-negative terms is non-negative, positive semi-definiteness holds." },
                { equation: "\\text{Guarantees valid Cholesky for Monte Carlo at any stress level.}", explanation: "A valid covariance matrix must be PSD to sample multidimensional paths." }
              ]}
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
            <FormulaCard
              id="f-6b"
              title="6b. Stressed Portfolio Volatility"
              formula="\sigma_p(\alpha) = \sqrt{\mathbf{w}^\top \boldsymbol{\Sigma}_s(\alpha)\,\mathbf{w}} \cdot \sqrt{252}"
              description="Annualized portfolio volatility as a function of stress level α. Monotonically increasing from σ_p(0) = realized vol to σ_p(1) = (Σ_iw_iσ_i) = diversification-free vol."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
          </div>

          {/* SECTION 7 */}
          <div id="sec-7" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>7. Contagion Dynamics</h2>
            <FormulaCard
              id="f-7a"
              title="7a. Capital Flow Contagion Rule"
              formula="\mathbf{w}(t+1) = \frac{(\mathbf{I} + \beta\mathbf{A})\,\mathbf{w}(t)}{\|(\mathbf{I} + \beta\mathbf{A})\,\mathbf{w}(t)\|_1}"
              description="Iterative weight redistribution driven by the correlation-weighted adjacency matrix A. β controls the contagion rate. L1 normalization keeps weights summing to 1."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
            <FormulaCard
              id="f-7b"
              title="7b. Stability Condition"
              formula="\rho(\mathbf{I} + \beta\mathbf{A}) = 1 + \beta\lambda_{\max}(\mathbf{A}) \implies \beta < \frac{1}{\lambda_{\max}(\mathbf{A})}"
              description="The spectral radius of the system matrix. When β exceeds 1/λ_max, the dominant eigenvector of A absorbs all weight — herding collapse. The stability threshold is shown as a red line in the contagion simulator."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
            <FormulaCard
              id="f-7c"
              title="7c. Herding Collapse Limit"
              formula="\lim_{t\to\infty} \mathbf{w}(t) = \mathbf{v}_1, \quad \mathbf{A}\mathbf{v}_1 = \lambda_{\max}\mathbf{v}_1"
              description="As t→∞ with β above threshold, weights converge to the dominant eigenvector of A. All capital concentrates in the most central assets — maximum systemic fragility."
              usedInConfig={{ links: [{ label: 'Stress Testing', route: '/stress' }] }}
            />
          </div>

          {/* SECTION 8 */}
          <div id="sec-8" style={{ marginBottom: 64, scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>8. Risk Measures</h2>
            <FormulaCard
              id="f-8a"
              title="8a. Log Returns"
              formula="r_t = \ln\frac{P_t}{P_{t-1}}"
              description="Log returns are approximately normally distributed, time-additive, and numerically stable for GBM simulation. Preferred over simple returns for multi-period analysis."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }, { label: 'Price History', route: '/prices' }] }}
            />
            <FormulaCard
              id="f-8b"
              title="8b. Pearson Correlation"
              formula="\rho_{ij} = \frac{\mathrm{Cov}(r_i, r_j)}{\sigma_i \sigma_j} = \frac{\sum_t (r_{i,t}-\bar{r}_i)(r_{j,t}-\bar{r}_j)}{\sqrt{\sum_t(r_{i,t}-\bar{r}_i)^2 \cdot \sum_t(r_{j,t}-\bar{r}_j)^2}}"
              description="Measures linear co-movement between asset log returns. Used to construct the correlation matrix and graph edge weights. ρ = 1 means perfect co-movement."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }, { label: 'Price History', route: '/prices' }] }}
            />
            <FormulaCard
              id="f-8c"
              title="8c. Network Density"
              formula="D = \frac{2|E|}{|V|(|V|-1)}, \quad E = \{(i,j) : |\rho_{ij}| > \theta\}"
              description="Fraction of possible edges present above threshold θ = 0.4. Dense networks transmit shocks more efficiently. D = 1 means all assets are highly correlated."
              usedInConfig={{ links: [{ label: 'Network Graph', route: '/network' }, { label: 'Price History', route: '/prices' }] }}
            />
          </div>

          {/* SECTION 9 */}
          <div id="sec-9" style={{ scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>9. Efficient Frontier</h2>
            <FormulaCard
              id="f-9a"
              title="9a. Efficient Frontier (Markowitz)"
              formula="\min_{\mathbf{w}} \mathbf{w}^\top\boldsymbol{\Sigma}\mathbf{w} \quad \text{s.t.} \quad \mathbf{w}^\top\boldsymbol{\mu} = \mu^*, \quad \mathbf{w}^\top\mathbf{1} = 1"
              description="The set of portfolios achieving minimum variance for each target return μ*. The upper boundary is the efficient frontier. Solved via Lagrangian: L = wᵀΣw - λ(wᵀμ - μ*) - γ(wᵀ1 - 1)."
            />
            <FormulaCard
              id="f-9b"
              title="9b. Global Minimum Variance Portfolio"
              formula="\mathbf{w}^* = \frac{\boldsymbol{\Sigma}^{-1}\mathbf{1}}{\mathbf{1}^\top\boldsymbol{\Sigma}^{-1}\mathbf{1}}"
              description="The portfolio with the lowest possible variance regardless of expected return. Found by setting ∂L/∂w = 0 with only the budget constraint active (λ = 0)."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
