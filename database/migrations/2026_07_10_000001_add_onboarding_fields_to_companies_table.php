<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('vat')->nullable()->after('name');
            $table->string('country')->nullable()->after('vat');
            $table->string('company_size')->nullable()->after('employees_count');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['vat', 'country', 'company_size']);
        });
    }
};