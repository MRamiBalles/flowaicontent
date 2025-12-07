import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";

export default function Terms() {
    const { user, isAdmin } = useUser();

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto py-12 px-4 max-w-4xl">
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-invert max-w-none space-y-6">
                    <p className="text-lg text-muted-foreground">Last updated: December 2024</p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using FlowAI, you accept and agree to be bound by the terms and provision of this agreement.
                            In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                        <p>
                            FlowAI provides users with access to a rich collection of resources, including various communications tools,
                            search services, and personalized content generation tools through its network of properties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
                        <p>You agree to not use the Service to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Generate content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.</li>
                            <li>Harm minors in any way.</li>
                            <li>Impersonate any person or entity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
                        <p>
                            You retain ownership of the content you generate using FlowAI, subject to the terms of the underlying AI models.
                            FlowAI retains ownership of the platform, interface, and underlying technology.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
                        <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
