import os
import sys
import google.generativeai as genai

def analyze_test_failure(log_file_path):
    """
    Analyzes a failed test log using Gemini and provides a root-cause classification.
    Helps distinguish between Flaky Environments, Test Bugs, and Product Bugs.
    """
    if not os.path.exists(log_file_path):
        print(f"Error: Log file not found at {log_file_path}")
        sys.exit(1)
        
    with open(log_file_path, 'r') as f:
        log_content = f.read()

    # In a real CI environment, this would use the GOOGLE_API_KEY from secrets
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        print("Warning: GOOGLE_API_KEY not found in environment. Mocking response for CI demo.")
        print("\n--- AI Triage Report ---")
        if "Timeout" in log_content or "Connection refused" in log_content:
            print("Classification: Flaky Environment Issue")
            print("Reasoning: The log indicates a network timeout or connection refusal, which usually points to a transient environment issue rather than a code defect.")
        else:
            print("Classification: Test Bug or Product Bug")
            print("Reasoning: The log shows an assertion failure. Please investigate if the contract changed.")
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are an expert SDET (Software Development Engineer in Test).
    Analyze the following test execution log. Determine the most likely root cause.
    Classify the failure into one of three categories:
    1. Flaky Environment Issue (e.g., network timeout, service down)
    2. Test Bug (e.g., bad locator, outdated assertion, race condition in test code)
    3. Product Bug (e.g., actual application defect, 500 error, wrong response)
    
    Provide your classification and a brief, precise explanation.
    
    Test Log:
    '''
    {log_content[:5000]} # Limit log size
    '''
    """

    print("Analyzing log with AI...")
    try:
        response = model.generate_content(prompt)
        print("\n--- AI Triage Report ---")
        print(response.text)
    except Exception as e:
        print(f"Error during AI analysis: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ai_test_triage.py <path_to_failed_test_log>")
        sys.exit(1)
        
    log_file = sys.argv[1]
    analyze_test_failure(log_file)
