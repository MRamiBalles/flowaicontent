import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";

export default function Privacy() {
    const { user, isAdmin } = useUser();

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto py-12 px-4 max-w-4xl">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-invert max-w-none space-y-6">
                    <p className="text-lg text-muted-foreground">Last updated: December 2024</p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p>
                            FlowAI ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address and telephone number.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                            <li><strong>Usage Data</strong> includes information about how you use our website, products and services (e.g., AI generations).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. AI Data Usage</h2>
                        <p>
                            Content generated through our AI tools is processed by third-party providers (e.g., OpenAI, Stability AI).
                            We do not use your private generations to train our public models without your explicit consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                        <p>If you have any questions about this privacy policy, please contact us at support@flowai.com.</p>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
