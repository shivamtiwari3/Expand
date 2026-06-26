"use client";

import { CardCanvas, Card } from "@/components/ui/card-borders";
import { BarChart3, Cpu, Brain, Terminal, FileText } from "lucide-react";

const silos = [
  {
    id: "eda",
    name: "EDA & Analytics",
    layer: "01",
    description: "Inspect data distributions, load raw datasets, and perform automated statistical tests in-browser.",
    icon: BarChart3,
  },
  {
    id: "features",
    name: "Feature Pipeline",
    layer: "02",
    description: "Search feature spaces, generate encoders, and construct robust datasets with zero human lag.",
    icon: Cpu,
  },
  {
    id: "architecture",
    name: "Architecture Search",
    layer: "03",
    description: "Decompose model constraints, formulate custom neural topologies, and auto-tune hyper-parameters.",
    icon: Brain,
  },
  {
    id: "sandbox",
    name: "Sandbox Validation",
    layer: "04",
    description: "Run code execution blocks inside isolated sandboxes, verify test cases, and aggregate stdout/stderr.",
    icon: Terminal,
  },
  {
    id: "drafting",
    name: "Paper Drafting",
    layer: "05",
    description: "Generate production-grade LaTeX reports, compile equations, and render publication-ready vector plots.",
    icon: FileText,
  },
];

export function SiloFeatures() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Five layers, one context
          </div>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
            From raw data to publication.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
            The reasoning engine coordinates every phase. No context is lost when transitioning
            from exploratory coding to neural modeling.
          </p>
        </div>

        <CardCanvas>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center relative z-10">
            {silos.map((silo) => {
              const Icon = silo.icon;
              return (
                <Card
                  key={silo.id}
                  className="min-h-[280px] p-6 bg-surface/40"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Icon
                          className="h-5 w-5 text-accent"
                          strokeWidth={1.5}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                          Layer {silo.layer}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-2xl tracking-tight text-foreground">
                        {silo.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                        {silo.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardCanvas>
      </div>
    </section>
  );
}

